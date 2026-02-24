

# Solution 4: SSE Streaming Implementation Plan

## Overview

Add streaming to the chat edge function so that empathy text appears within ~1 second and the question streams in real-time, replacing the artificial typewriter animation. The backend will call the AI gateway with `stream: true`, perform incremental JSON extraction from the token stream, and emit custom SSE events. The frontend will consume these events and render content as it arrives.

## Backend Changes (`supabase/functions/chat/index.ts`)

### 1. Add `callAIStreaming()` function (after existing `callAI` at ~line 532)

A new function that calls the AI gateway with `stream: true` and returns the raw `ReadableStream` body. Same parameters as `callAI` but returns the response body stream instead of a parsed string.

### 2. Add `streamSSEResponse()` helper

This function takes the AI stream, reads tokens incrementally, buffers them, and performs regex-based extraction:

- Accumulates all content deltas into a buffer string
- After each delta, attempts to extract `"empathy"` value via regex: `/"empathy"\s*:\s*"((?:[^"\\]|\\.)*)"/`
- Once empathy is found, emits an SSE `event: empathy` immediately
- Watches for `"question": "` marker in the buffer, then emits each subsequent character batch as `event: question_delta`
- When the stream ends, parses the complete JSON for `inputType`/`inputConfig` and emits `event: metadata`
- Emits `event: done` with completion flags (`shouldComplete`, `structuredSummary`, `themeProgress`)

SSE format:
```
event: empathy
data: Thanks for sharing that.

event: question_delta
data: What

event: question_delta
data: What would help

event: metadata
data: {"inputType":"text","inputConfig":{},"themeProgress":{...}}

event: done
data: {"shouldComplete":false}
```

### 3. Modify the two main AI call paths to support streaming

**Detection**: Check if the incoming request has `Accept: text/event-stream` header. If yes, use streaming path. If no, use existing JSON path (backward compatibility).

**Preview mode path (~line 863)**: Replace the `callAI` + JSON response with `callAIStreaming` + `streamSSEResponse` when streaming is requested. The response will be `new Response(readableStream, { headers: { "Content-Type": "text/event-stream", ...corsHeaders } })`.

**Authenticated path (~line 1532)**: Same change. The DB insert and background classification still happen — the stream emits the AI response while a callback after stream completion handles the DB write and background task kick-off.

**Completion path (~line 1788)**: For the `shouldComplete` flow, the structured summary AI call still uses non-streaming `callAI` (it's a small fast call to the lite model). The summary is included in the `done` SSE event.

**Introduction triggers**: These return static/pre-computed messages, so they continue to use JSON responses (no streaming needed for instant responses).

### 4. Handle DB save timing for streaming

The DB insert currently happens before the response is sent. With streaming, we need to:
- Start the AI stream and pipe SSE events to the client immediately
- Buffer the complete AI response text as we stream it
- After the stream ends, perform the DB insert and kick off background classification
- Use `EdgeRuntime.waitUntil()` for the DB save so it doesn't block the SSE connection close

## Frontend Changes

### 1. `src/components/employee/FocusedInterviewInterface.tsx` — Update `handleSubmit`

Replace the current `fetch` + `response.json()` pattern (lines 299-383) with a streaming fetch:

- Add `Accept: text/event-stream` header to the fetch request
- Read the response body as a `ReadableStream` using `getReader()`
- Parse SSE events line-by-line (using the pattern from the knowledge doc)
- Handle custom events:
  - `empathy` → call `setCurrentEmpathy(data)` immediately
  - `question_delta` → call `setCurrentQuestion(data)` (accumulative — each delta is the full question so far)
  - `metadata` → set `inputType`, `inputConfig`, `themeProgress`
  - `done` → set `shouldComplete`/`structuredSummary`, finalize loading state
- Add `isStreaming` state to distinguish streaming mode from typewriter mode
- Add fallback: if response content-type is `application/json` (non-streaming), fall back to existing JSON parsing logic

### 2. `src/components/employee/AIResponseDisplay.tsx` — Add streaming mode

Add a `streaming` prop to the component interface:

```typescript
interface AIResponseDisplayProps {
  empathy?: string;
  question: string;
  isLoading?: boolean;
  isTransitioning?: boolean;
  streaming?: boolean;  // NEW
  onTypingComplete?: () => void;
}
```

When `streaming=true`:
- Bypass both `useTypewriter` hooks entirely
- Render `empathy` and `question` directly as they update via props
- Show the blinking cursor while `question` is still growing (detect via prop changes)
- Call `onTypingComplete` when streaming finishes (signaled by parent setting `streaming=false`)

When `streaming=false` (default): existing typewriter behavior unchanged.

### 3. `src/components/employee/FocusedInterviewInterface.tsx` — Pass streaming state

- Pass `streaming={isStreaming}` to `AIResponseDisplay`
- When streaming completes (on `done` event), set `isStreaming=false` and `isTypingComplete=true`
- The input field remains disabled during streaming (same as during typewriter)

## Files Changed

| File | What |
|------|------|
| `supabase/functions/chat/index.ts` | Add `callAIStreaming()`, `streamSSEResponse()`. Modify preview path (~line 863) and authenticated path (~line 1532) to use streaming when `Accept: text/event-stream`. Handle DB save after stream. |
| `src/components/employee/AIResponseDisplay.tsx` | Add `streaming` prop that bypasses typewriter hooks and renders text directly with cursor. |
| `src/components/employee/FocusedInterviewInterface.tsx` | Update `handleSubmit` to use streaming fetch with SSE parsing. Add `isStreaming` state. Pass to `AIResponseDisplay`. |

## Backward Compatibility

- Non-streaming clients (no `Accept: text/event-stream` header) get JSON as before
- `useChatAPI.ts` hook (used by `ChatInterface.tsx`) is NOT changed — it continues using JSON. Only `FocusedInterviewInterface` gets streaming since it's the primary interview experience
- Introduction triggers and completion summary generation remain JSON-based
- If streaming fetch fails mid-stream, fall back to error handling same as current

## Technical Details

### Incremental JSON Extraction Strategy

The AI returns tokens like: `{`, `"em`, `pathy`, `": "`, `Thanks`, ` for`, ` sharing`, `."`, `, "`, `quest`, `ion"`, `: "`, `What`, ` would`, ` help`, `?"`, `}`

Extraction approach:
1. Buffer all content deltas into a single string
2. After each delta, check for completed empathy: `/"empathy"\s*:\s*"((?:[^"\\]|\\.)*)"/` — emit once matched
3. For question: track position after `"question": "` marker, emit cumulative text for each new character batch
4. Handle escaped quotes in values (`\"`) correctly
5. After stream ends: full `JSON.parse` for `inputType`/`inputConfig` (these are short values at the end)

### SSE Event Format (custom, not OpenAI-compatible)

Each event uses the standard SSE format with custom event types:
```
event: empathy\ndata: <text>\n\n
event: question_delta\ndata: <cumulative text>\n\n
event: metadata\ndata: <json>\n\n
event: done\ndata: <json>\n\n
```

The frontend parser reads `event:` lines to determine type, then `data:` lines for content. This is simpler than parsing OpenAI-format SSE on the frontend since we control both sides.

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Time to empathy visible | 2-3s | ~0.8-1.2s |
| Time to first question char | 2-3s + typewriter | ~1.0-1.5s |
| Perceived blank screen wait | 2-3s | ~0.8s |

