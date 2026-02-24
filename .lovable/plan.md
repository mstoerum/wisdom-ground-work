

# Solution 4: SSE Streaming for Chat Responses

## The Challenge

The AI returns **structured JSON** (`{"empathy": "...", "question": "...", "inputType": "...", "inputConfig": {...}}`). You can't stream JSON token-by-token to the frontend because you need the complete object to extract fields. This is the core tension.

## Approach: Two-Phase SSE Stream

Instead of streaming raw tokens, use a **two-phase approach**:

1. **Phase 1**: The edge function calls the AI with `stream: true`, buffers the full response internally, parses the JSON
2. **Phase 2**: Sends parsed fields to the frontend as discrete SSE events, with the `question` field streamed character-by-character

This gives us fast time-to-first-token (the empathy text arrives as soon as JSON is parsed) and the question streams in real-time, replacing the artificial `useTypewriter` animation with actual streaming.

```text
SSE Event Flow:
  event: empathy     → data: "Thanks for sharing that."     (~1.5s after request)
  event: question    → data: "W"                             (~1.5s)
  event: question    → data: "Wh"                            (...)
  event: question    → data: "Wha"                           (...)
  ...
  event: question    → data: "What would help?"              (~1.8s)
  event: metadata    → data: {"inputType":"text",...}         (~1.8s)
  event: done        → data: {"shouldComplete":false,...}     (~1.8s)
```

Wait — this is over-engineering it. The real bottleneck is the **AI inference time** (~1.5-3s). Streaming character-by-character from a buffered response adds no value since we already have the typewriter effect doing that.

## Revised Approach: Stream the AI Call Itself

The Lovable AI gateway supports OpenAI-compatible streaming (`stream: true`). Instead of buffering the full response, we:

1. Call AI with `stream: true`
2. Forward the raw token stream as SSE to the frontend  
3. The frontend accumulates tokens, attempts JSON parse on each chunk
4. Once JSON is parseable, extract `empathy` → show immediately, then stream `question` tokens as they arrive

But this is fragile — partial JSON won't parse until it's nearly complete, and `inputType`/`inputConfig` won't be available until the very end.

## Pragmatic Solution: Keep JSON, Stream the Gateway Response

The simplest high-impact approach:

1. **Backend**: Call AI gateway with `stream: true`, accumulate the full streamed response (faster than non-streaming because first token arrives sooner and we can detect errors earlier), then send the parsed result as a normal JSON response
2. **Frontend**: No changes needed — the typewriter effect already provides perceived streaming

This doesn't reduce perceived latency much. Let me think about what actually will.

## Final Design: Hybrid Stream

The real win is sending the **empathy** and **question** as separate SSE events as soon as we can parse them from the streaming AI response, while metadata (`inputType`, `themeProgress`, etc.) comes as a final event.

### Backend Changes (`supabase/functions/chat/index.ts`)

**New function: `callAIStreaming`** — wraps the AI gateway with `stream: true`, returns an async iterator of content chunks.

**New function: `streamParsedResponse`** — buffers chunks, attempts incremental JSON extraction:
- As soon as `"empathy"` value is complete → emit SSE `empathy` event
- As soon as `"question"` value starts → emit SSE `question_start`, then stream each new character as `question_delta`
- When complete → emit `metadata` event with `inputType`, `inputConfig`, `shouldComplete`, `themeProgress`
- Emit `done` event

**Response format change**: For streaming-capable requests (frontend sends `Accept: text/event-stream`), return SSE. For non-streaming (backward compat), return JSON as before.

### Frontend Changes

**`src/hooks/useChatAPI.ts` → `sendMessage`**: 
- Add `Accept: text/event-stream` header
- Use `EventSource` or manual `ReadableStream` reader on the response
- On `empathy` event → set empathy immediately (no typewriter needed — it's already fast)
- On `question_start` → begin showing question
- On `question_delta` → append to displayed question (replaces typewriter)
- On `metadata` → set `inputType`, `inputConfig`, `themeProgress`
- On `done` → set `shouldComplete`, `structuredSummary`, finalize

**`src/components/employee/AIResponseDisplay.tsx`**:
- Add a `streaming` mode where `question` updates incrementally (bypasses `useTypewriter`)
- When `streaming=true`, render `question` directly with cursor instead of typewriter

**`src/components/employee/FocusedInterviewInterface.tsx`**:
- Update `handleSubmit` to use streaming fetch
- Manage streaming state: `isStreaming`, incremental `currentQuestion` updates

### SSE Protocol

```text
event: empathy
data: Thanks for sharing that.

event: question_start
data: 

event: question_delta
data: What

event: question_delta  
data: What would

event: question_delta
data: What would help

event: question_delta
data: What would help improve

event: question_delta
data: What would help improve this?

event: metadata
data: {"inputType":"text","themeProgress":{...}}

event: done
data: {"shouldComplete":false}
```

### Incremental JSON Parsing Strategy

The AI returns `{"empathy": "...", "question": "...", "inputType": "..."}`. As tokens stream in:

1. Buffer all tokens into a string
2. After each token, check if we can extract `empathy` using regex: `/"empathy"\s*:\s*"([^"]*)"/`
3. Once empathy is extracted → emit `empathy` SSE event immediately  
4. For question: watch for `"question": "` marker, then stream every subsequent character until closing `"`
5. After stream ends, parse full JSON for `inputType`/`inputConfig`

This means empathy appears **as soon as the AI generates it** (typically within the first ~20 tokens), and the question streams in real-time.

---

## Files to Change

| File | Changes |
|------|---------|
| `supabase/functions/chat/index.ts` | Add `callAIStreaming()` function. Modify the two main response paths (preview ~line 863 and authenticated ~line 1532) to use streaming when client requests it. Add SSE response helpers. |
| `src/hooks/useChatAPI.ts` | Update `sendMessage` and `triggerIntroduction` to use streaming fetch with `ReadableStream` reader. Parse SSE events incrementally. |
| `src/components/employee/AIResponseDisplay.tsx` | Add `streaming` prop that bypasses typewriter and renders question text directly with cursor animation. |
| `src/components/employee/FocusedInterviewInterface.tsx` | Update `handleSubmit` to use streaming. Manage `isStreaming` state. Pass streaming question/empathy updates to `AIResponseDisplay`. |
| `src/hooks/useTypewriter.ts` | No changes needed — streaming mode bypasses it entirely. |

## Backward Compatibility

- If the frontend doesn't send `Accept: text/event-stream`, the backend returns JSON as before (no breaking change)
- The `useChatAPI.ts` hook (used by `ChatInterface`) and `FocusedInterviewInterface` (direct fetch) both get streaming support
- `handleFinalResponse` and `handleConfirmFinishEarly` in `useChatAPI` keep using JSON (these are completion flows where streaming adds little value)

## Expected Latency Improvement

| Metric | Before | After Streaming |
|--------|--------|----------------|
| Time to empathy visible | 2-3s | ~0.8-1.2s |
| Time to first question character | 2-3s + typewriter delay | ~1.0-1.5s |
| Total question visible | 2-3s + typewriter (1-2s) | ~1.5-2.5s (real-time) |
| Perceived wait (blank screen) | 2-3s | ~0.8s |

The main win: the user sees **empathy text within ~1 second** instead of staring at loading dots for 2-3 seconds. The question then streams in naturally instead of via artificial typewriter animation.

