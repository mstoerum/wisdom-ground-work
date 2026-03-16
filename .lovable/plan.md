

## Plan: Integrate v3 System Prompt

The v3 prompt is a significant upgrade that introduces a `thinking` field, a more natural tone ("types like messaging"), a reflecting/reframing mechanic, and restructured probing principles. Here's how to integrate it.

### Key Differences from Current (v2) → v3

1. **New `thinking` field** in response JSON — private reasoning, never shown to respondent
2. **Tone shift** — from "professional researcher" to "thoughtful person typing in a chat"
3. **Probing restructured** — from a 10-pattern toolkit list to two principles (Abstract→Concrete, Description→Meaning) plus variety
4. **New "Reflecting & Reframing" mechanic** — pattern-spotting every 4-5 exchanges, framed as a question
5. **Empathy rules refined** — adds "never longer than their response", "null when brief/factual", removes explicit length ranges
6. **Transitions refined** — "2-4 exchanges" (was "2-3"), awareness that brief answers may signal discomfort
7. **Input types** — demoted from rhythm system to "exception, not variety"; no interactive after emotional content
8. **Opening** — now requires safety/purpose/expectations preamble before first question
9. **Closing** — personalized gratitude referencing specific content (not generic thanks)
10. **Probing Lenses** renamed and restructured per survey type
11. **Anti-patterns section** — explicit "Bad interviewing" examples added
12. **"Avoid" section** — explicitly bans therapeutic language, referencing interview structure

### Changes

**File 1: `supabase/functions/chat/context-prompts.ts`** (full rewrite of prompt constants and both prompt functions)

- **Replace `RESPONSE_FORMAT`** — add `thinking` field to JSON schema
- **Replace `EMPATHY_RULES`** — incorporate v3 rules: null when brief/factual, never longer than their response, no emotion labeling, no therapeutic language
- **Replace `CORE_APPROACH`** — new tone ("types like messaging"), add "Avoid" section (therapeutic language, referencing structure), add cognitive empathy framing
- **Replace `PALPABLE_EVIDENCE`** — restructure into Abstract→Concrete and Description→Meaning principles, plus variety rule
- **Add new `REFLECTING` constant** — pattern-spotting mechanic with rules (question not conclusion, max once per 4-5 exchanges, never after emotional content)
- **Replace `THEME_TRANSITIONS`** — update to 2-4 exchanges, add discomfort awareness ("brief answers may signal discomfort — one gentle follow-up before moving on")
- **Replace `INPUT_TYPES`** — demote to exception-only, add rule against interactive after emotional content
- **Replace `SKIP_HANDLING`** — minor wording alignment
- **Add new `OPENING` constant** — safety, purpose, expectations preamble
- **Add new `CLOSING` constant** — personalized gratitude rules with good/bad examples
- **Rewrite `getCourseEvaluationPrompt`** — integrate all new constants, add v3 examples (including bad interviewing anti-patterns), use course-specific probing lenses
- **Rewrite `getEmployeeSatisfactionPrompt`** — same treatment, employee-specific probing lenses (Autonomy, Competence, Relatedness, Recognition, Fairness)
- **Rewrite few-shot examples** in both prompts — include `thinking` field, add bad-interviewing anti-patterns

**File 2: `supabase/functions/chat/index.ts`**

- **Update `parseStructuredResponse`** — extract and discard `thinking` field from parsed JSON (never send to client). Add `thinking` to console.log for debugging
- No model/temperature changes needed (already on gemini-3-flash-preview at 0.65)

**File 3: `docs/interview-system-prompt.md`** — replace with v3 content

**File 4: `supabase/functions/chat/context-prompts.ts` → `buildConversationContextForType`** — no structural changes needed; the existing Q&A pairs, theme tracking, and mustTransition logic all remain compatible with v3

### What stays the same
- Model (`gemini-3-flash-preview`) and temperature (`0.65`)
- `buildConversationContextForType` — the conversation context block
- `buildThemesText` helper
- All completion logic, rate limiting, sentiment analysis in index.ts
- The `SurveyType` type and function signatures

### Deployment
- Deploy updated `chat` edge function after changes

