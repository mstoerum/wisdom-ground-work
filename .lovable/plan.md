

## Change the villager interview check-in question and add a light follow-up

The user wants the villager interview mood check-in to ask "How has your week in the village been?" instead of "How's work been this week?", and then show one light follow-up before diving into themes. This only affects villager interviews.

### Changes

**1. `src/components/employee/FocusedInterviewInterface.tsx`**

- Pass a villager-specific question prop to `MoodSelector` when `surveyType === 'villager_interview'`:
  ```
  <MoodSelector
    onMoodSelect={handleMoodSelect}
    question={surveyType === 'villager_interview'
      ? "How has your week in the village been?"
      : undefined}
  />
  ```

- Update the fallback questions (lines 161-168) to include villager-specific versions when `surveyType === 'villager_interview'`:
  ```
  // Villager fallbacks use lighter, community-focused follow-ups
  1: "That sounds rough. What's been the most annoying thing this week?"
  2: "I get that. Anything specific bugging you about life here?"
  3: "Fair enough. What's one thing you'd tweak about the village?"
  4: "Nice! Got a favorite spot around here?"
  5: "Love it! What's making village life feel good right now?"
  ```

**2. `src/components/employee/MoodTransition.tsx`**

- Accept an optional `surveyType` prop
- When `surveyType === 'villager_interview'`, show lighter, village-specific acknowledgment messages instead of the work-focused defaults (e.g., mood 3: "Got it. Let's chat about village life." instead of "Sometimes 'okay' says a lot.")

**3. `supabase/functions/chat/first-questions.ts`**

- Update `getMoodAdaptiveResponse` villager cases to use lighter, more personal follow-up questions that feel casual (these are what the AI actually sends as the first real question after mood selection)

**4. `supabase/functions/chat/context-prompts.ts`**

- No changes needed — the villager prompt already sets the casual tone for subsequent questions

### What stays untouched

Employee satisfaction and course evaluation flows remain identical — all changes are gated behind `surveyType === 'villager_interview'` checks.

