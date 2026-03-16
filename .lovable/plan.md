

## Plan: Remove Opening Preamble

The mood selector already serves as the conversational entry point. The `OPENING` constant adds an awkward confidentiality speech before the first question. We'll remove it so the AI jumps straight into a mood-adaptive follow-up.

### Changes

**`supabase/functions/chat/context-prompts.ts`**
1. Delete the `OPENING` constant (lines 119-126)
2. Remove `${OPENING}` from both `getCourseEvaluationPrompt` and `getEmployeeSatisfactionPrompt`
3. Update "CONVERSATION FLOW" step 1 in both prompts: change from "Open — configured opening (safety, purpose, expectations), then first question" → "Open — the respondent has already selected their mood. Ask the provided first question directly."

**`docs/interview-system-prompt.md`**
- Remove the Opening section, add a note that the mood selector serves as the opening

**Deploy** the `chat` edge function

