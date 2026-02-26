

# Feature: Skip Question (Jump to Next Theme)

## Overview

Add a "Skip" button to the interview interface that lets the employee skip the current question. When skipped, the backend receives a `[SKIP_QUESTION]` signal and responds with a question from the next undiscussed theme instead of following up on the current one.

## User Experience

- A subtle "Skip" link/button appears below the answer input area (next to "Continue")
- Clicking it immediately transitions to the next question -- no confirmation dialog needed
- The AI acknowledges the skip gracefully (e.g., "No worries, let's move on.") and asks about a different theme
- Skips are tracked so analytics can see which themes employees chose to skip
- The button is disabled while loading or on the very first question

## Technical Changes

### 1. Frontend: `src/components/employee/FocusedInterviewInterface.tsx`

Add a `handleSkip` function that calls `handleSubmit("[SKIP_QUESTION]")` -- reusing the existing submit flow with a special signal (same pattern as `[START_CONVERSATION]` and `[REFLECTION_COMPLETE]`).

Add a "Skip" button in the input area (around line 490, near the AnswerInput/InteractiveInputRouter):
```
<Button variant="ghost" size="sm" onClick={handleSkip}>
  Skip this question
</Button>
```

Disable when `isLoading`, `questionNumber < 1`, or during transition.

### 2. Frontend: `src/components/employee/AnswerInput.tsx`

Add an optional `onSkip` prop and render a "Skip" link below the Continue button when provided. This keeps the skip action visually close to the input.

### 3. Frontend: `src/components/employee/inputs/InteractiveInputRouter.tsx`

Pass through an optional `onSkip` prop to all interactive input types so the skip button appears regardless of input mode (text, word cloud, slider, etc.).

### 4. Backend: `supabase/functions/chat/index.ts`

In the main message handler (around line 900-950 where `lastContent` is processed):

- Detect `[SKIP_QUESTION]` signal
- When detected:
  - Save the skip as a response with `content: "[SKIPPED]"` and tag it with the current theme
  - In `buildConversationContext`, add an instruction: "The user skipped the previous question. Move to a different theme immediately."
  - Set `sentiment` to `"neutral"` for the skipped response
- The existing theme transition logic will handle the rest since the context already tracks per-theme depth and uncovered themes

### 5. Backend: `supabase/functions/chat/context-prompts.ts`

Add a `SKIP_HANDLING` instruction to the shared constants:
```
When the user's last message is "[SKIPPED]", respond with a brief, warm 
transition (e.g., "No problem, let's talk about something else.") and 
immediately ask about an undiscussed theme. Keep empathy to 3-5 words max.
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/employee/FocusedInterviewInterface.tsx` | Add `handleSkip` callback and pass `onSkip` to input components |
| `src/components/employee/AnswerInput.tsx` | Add optional `onSkip` prop, render "Skip" link |
| `src/components/employee/inputs/InteractiveInputRouter.tsx` | Pass `onSkip` through to all input types |
| `supabase/functions/chat/index.ts` | Detect `[SKIP_QUESTION]`, save as skipped response, add skip context to AI |
| `supabase/functions/chat/context-prompts.ts` | Add `SKIP_HANDLING` constant with transition instructions |
