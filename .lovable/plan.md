

## Skip mood check-in for villager interviews

For villager interviews, bypass the mood selector and transition entirely — jump straight to the first theme question.

### Changes

**`src/components/employee/FocusedInterviewInterface.tsx`**

- Change `showMoodSelector` initial state: when `surveyType === 'villager_interview'`, initialize to `false`
- Add a `useEffect` that fires only for villager interviews on mount: calls `initializeConversation(3)` (neutral mood as default) and sets `isInitialized = true`, effectively skipping mood selection and transition
- The component will go straight to the loading state → first theme question

**`supabase/functions/chat/first-questions.ts`**

- In `getMoodAdaptiveResponse` and `buildWarmIntroduction`, when `surveyType === 'villager_interview'` and mood is 3 (the default we'll pass), return the warm village intro directly and jump to the first theme question — no mood follow-up

No other files affected. Employee satisfaction and course evaluation flows remain identical.

