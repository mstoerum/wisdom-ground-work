

# Chat Function Performance Analysis & Optimization Plan

## The Problem

Every user message triggers **up to 4 sequential AI API calls** before a response is returned. This creates a perceived latency of 3-8+ seconds per exchange, which destroys the conversational feel.

## Root Cause Analysis

### Current AI Call Chain (Authenticated Path, lines 1532-1551)

For each user message, these calls happen **before** the response is sent back:

```text
1. Main AI response (gemini-2.5-flash)     ~1.5-3s
2. Sentiment analysis (gemini-2.5-flash-lite) ~0.5-1s  ┐
3. Theme detection (gemini-2.5-flash-lite)    ~0.5-1s  ├── Promise.all (parallel)
4. Urgency detection (gemini-2.5-flash-lite)  ~0.5-1s  ┘
```

Steps 2-4 run in parallel via `Promise.all` (line 1547), but they still **block the response** — the user doesn't see the AI's answer until all 4 calls complete.

Then **after** the response is saved, there are two more database queries (lines 1760-1776) to re-fetch the latest response and all responses for theme progress — also blocking the return.

**Total blocking time**: Main AI call (~2s) + parallel classification (~1s) + DB insert + 2 DB queries ≈ **3-5 seconds minimum**.

### Additional Overhead

- The system prompt is **extremely long** (~2,500+ tokens including few-shot examples, research framework, interactive element instructions, rhythm rules, and conversation context). Longer prompts = slower inference.
- The full conversation history is sent with every request (all messages, not just recent ones), adding input tokens linearly.
- On the **completion path**, there are even more sequential AI calls: main response + sentiment + theme + urgency + structured summary = **5 AI calls** before the user sees anything.
- The `shouldComplete` check at line 1281 runs theme analysis logic, then if true, triggers another `callAI` for structured summary (lines 1301-1310) — adding yet another blocking call.
- Two extra DB reads after response insertion (lines 1760-1776) to build `themeProgress` — these block the response return.

### Preview Mode

Preview mode is slightly faster (no DB writes, no auth checks) but still makes the main AI call synchronously and has the same prompt bloat problem.

---

## Proposed Solutions (Ordered by Impact)

### Solution 1: Move Classification to Background (Highest Impact, Lowest Risk)

**Current**: Sentiment, theme, and urgency detection run **before** the response is returned (line 1547).

**Proposed**: Move all three classification calls into `EdgeRuntime.waitUntil()` alongside the existing background LLM analysis task. The response is returned immediately after the main AI call + DB insert.

**Impact**: Saves ~1 second per exchange (the parallel classification block).

**Risk**: Low. Classification data is only used for analytics, not for the conversational flow. The `buildConversationContext` function already reads from `previousResponses` which won't include the current response's classifications until next turn anyway. Theme progress on the frontend will update one exchange behind, which is acceptable.

**Nuance**: The `urgency_escalated` field on the response insert would need to default to `false` and be updated in the background task (or merged into the existing background analysis which already detects urgency).

### Solution 2: Eliminate Redundant Post-Insert DB Queries

**Current**: After inserting a response, two more DB queries run (lines 1760-1776):
1. Fetch the latest response's `theme_id` (we just inserted it — we already have it)
2. Re-fetch ALL responses for the conversation to build theme progress

**Proposed**: Use the data we already have in memory. We know `detectedThemeId` from the classification. We have `previousResponses` from the earlier fetch. Simply append the current response to the list and compute `buildThemeProgress` from that — no extra DB calls needed.

**Impact**: Saves ~100-300ms per exchange (2 DB roundtrips eliminated).

**Risk**: Negligible. Data accuracy is identical since we're building from the same data, just without re-fetching.

### Solution 3: Trim the System Prompt

**Current**: The system prompt is ~2,500+ tokens including the full research framework (5 psychological dimensions with signs/probes), all 7 interactive element type definitions with examples, rhythm rules, theme transition instructions, empathy calibration rules with few-shot examples, de-escalation rules, conversation flow rules, and the conversation context block.

**Proposed**: Create a compact version of the prompt (~800-1,000 tokens) that preserves the core behavior:
- Condense the interactive element instructions into a compact reference table instead of verbose descriptions with full JSON examples
- Move the research framework to a shorter "probing lens" list without detailed signs/probes
- Reduce few-shot examples from 6+ to 2 (one positive, one negative)
- Remove redundant instructions (the same "max 15 words" rule appears 3 times)

**Impact**: Reduces input tokens by ~60%, which directly reduces inference time. For `gemini-2.5-flash`, this could save 300-800ms per call.

**Risk**: Medium. Prompt changes can subtly alter AI behavior. Would need testing to verify quality is maintained. Can be done incrementally.

### Solution 4: Stream the AI Response

**Current**: The frontend waits for the complete response, then starts the typewriter animation. Double wait: network latency + typing animation.

**Proposed**: Use server-sent events (SSE) to stream the AI response token-by-token. The typewriter effect becomes the actual stream arrival rather than a post-fetch animation.

**Impact**: Perceived latency drops to ~200-500ms (time to first token) instead of 2-3s (time to complete response). This is the single biggest perceptual improvement.

**Risk**: Medium-high. Requires:
- Changing `callAI` to use streaming (`stream: true` on the API call)
- Changing the edge function response format from JSON to SSE
- Updating the frontend to consume an event stream instead of `response.json()`
- The structured JSON parsing (`parseStructuredResponse`) becomes harder with streaming since we need the complete JSON before parsing `inputType`/`inputConfig`

**Mitigation**: Can stream the conversational text while buffering the structured metadata. Return metadata as a final SSE event after the text stream completes.

### Solution 5: Use a Faster Model for Regular Exchanges

**Current**: Every exchange uses `gemini-2.5-flash` (line 24). The "lite" model is only used for classification tasks.

**Proposed**: Use `gemini-2.5-flash-lite` for the first 2-3 exchanges (simpler questions, less context) and reserve `gemini-2.5-flash` for deeper follow-ups and theme transitions. Or use `gpt-5-nano` for quick conversational turns.

**Impact**: Could save 300-500ms per exchange on simpler turns.

**Risk**: Lower quality responses on lite models. The interactive element JSON format compliance may degrade with weaker models. Would need quality testing.

### Solution 6: Merge Redundant Completion Paths

**Current**: The function has **6+ separate completion/summary generation paths** (lines 688, 1075, 1176, 1287, 1350, 1786). Each generates a structured summary with its own AI call. The code is ~1,875 lines with massive duplication.

**Proposed**: Consolidate into a single `generateCompletionResponse()` helper. This doesn't directly speed up individual calls but reduces code complexity, makes the other optimizations easier to implement, and eliminates edge cases where one path is optimized but another isn't.

**Impact**: Indirect — enables faster iteration on performance fixes.

**Risk**: Low, but requires careful testing of all completion flows.

---

## Recommended Implementation Order

1. **Solution 1** (background classification) + **Solution 2** (eliminate DB queries) — biggest latency savings, lowest risk, can ship together
2. **Solution 3** (trim prompt) — moderate savings, needs quality testing
3. **Solution 4** (streaming) — biggest perceptual improvement but most complex to implement
4. **Solution 6** (code consolidation) — prep work for long-term maintainability
5. **Solution 5** (model selection) — experiment after other optimizations

## Expected Improvement

| Metric | Current | After Solutions 1+2 | After All |
|--------|---------|---------------------|-----------|
| Time to response | 3-5s | 1.5-3s | 0.2-0.5s (streaming TTFT) |
| Blocking AI calls | 4 | 1 | 1 (streamed) |
| Blocking DB queries | 3 | 1 | 1 |
| System prompt tokens | ~2,500 | ~2,500 | ~1,000 |

