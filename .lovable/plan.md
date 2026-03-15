

## Implementation Plan: Interview Intelligence Upgrade

### What we're fixing
1. Empathy responses are repetitive ("Thanks for sharing that" in 5/6 examples)
2. Theme transitions are robotic (single template: "Shifting gears a bit —")
3. AI lacks awareness of its own previous questions (can't avoid repetition)
4. Context snippets truncated to 60 chars, only first 2 responses included
5. `RESPONSE_FORMAT` missing from course evaluation prompt
6. Dead code: `getSystemPrompt()` (line 334-438) is never called
7. Temperature too high for context-tracking (0.8)

### Changes

**File 1: `supabase/functions/chat/context-prompts.ts`**

1. **Rewrite `EMPATHY_RULES`** — Replace generic rules with content-aware variety requirement:
   - Add explicit anti-repetition: "Never reuse an empathy phrase you've already used"
   - Require empathy to reference what the person shared, not just that they shared
   - Add diverse examples by tone: positive ("That's a real strength"), neutral ("Got it"), negative ("That sounds like a lot to deal with"), after detail ("That's a clear example")

2. **Rewrite `THEME_TRANSITIONS`** — Replace single "Shifting gears" template with contextual bridging:
   - Bridge must connect to something the respondent said
   - Add 3-4 diverse examples: "You mentioned X — that connects to something I'm curious about...", "That's helpful context. On a different note...", "Building on what you said about X..."
   - Explicitly forbid "Shifting gears" as a transition

3. **Rewrite few-shot examples** in both `getCourseEvaluationPrompt` and `getEmployeeSatisfactionPrompt`:
   - Diversify empathy across all examples (no two starting with "Thanks")
   - Show content-aware empathy tied to the user's statement
   - Show contextual transitions that reference previous answers

4. **Add `RESPONSE_FORMAT`** to `getCourseEvaluationPrompt` (currently only in employee prompt)

5. **Upgrade `buildConversationContextForType`** to include last 3-4 paired Q&A exchanges:
   - Accept `messages` parameter (the chat history with role/content pairs)
   - Build a "RECENT EXCHANGES" block showing Q→A pairs
   - Increase snippet length from 60 to 150 chars
   - Show last 3-4 responses instead of first 2

**File 2: `supabase/functions/chat/index.ts`**

1. **Switch model**: `AI_MODEL` from `google/gemini-2.5-flash` → `google/gemini-3-flash-preview`

2. **Lower temperature**: All 3 `callAI` invocations from `0.8` → `0.65`

3. **Delete dead code**: Remove `getSystemPrompt()` (lines 334-438) and `buildConversationContext()` (lines 244-328) — both are unused. The authenticated flow at line 1672 currently calls `buildConversationContext` (local), so we'll switch it to use `buildConversationContextForType` from context-prompts.ts (with the upgraded paired Q&A logic), consolidating the two systems.

4. **Pass chat messages** to `buildConversationContextForType` so it can extract recent AI questions. Update all call sites (lines 832 and 1672) to pass the `messages` array alongside `previousResponses`.

5. **Upgrade local `buildConversationContext`** call at line 1672: replace with `buildConversationContextForType`, merging in the richer per-theme depth tracking and `mustTransition` logic from the local version into the shared function.

### Summary

| Change | File | Impact |
|---|---|---|
| Rewrite `EMPATHY_RULES` + examples | context-prompts.ts | Fixes "dull" empathy |
| Rewrite `THEME_TRANSITIONS` + examples | context-prompts.ts | Fixes "static" transitions |
| Add paired Q&A context (last 3-4) | context-prompts.ts | Smarter follow-ups |
| Add `RESPONSE_FORMAT` to course eval | context-prompts.ts | Prevents JSON failures |
| Switch to `gemini-3-flash-preview` | index.ts line 23 | Better conversational intelligence |
| Lower temperature to 0.65 | index.ts (3 locations) | More coherent context tracking |
| Merge duplicate prompt systems | index.ts | Remove dead code, single source of truth |
| Increase snippet length to 150 chars | context-prompts.ts | Better memory recall |

