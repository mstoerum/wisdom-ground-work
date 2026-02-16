

# Restore the "How's your week been?" Mood Selector

## Problem
The mood selector screen ("How's work been this week?" with emoji options from Tough to Great) is no longer shown to employees during the normal survey flow. It was removed as part of a previous "minimalist optimization" and currently only appears in demo mode (`minimalUI=true`).

In the normal flow, the code silently reads a mood value from localStorage (which is never set), defaults to "Okay" (3), and skips straight to the transition animation. Employees never get to express how they're feeling before the interview begins.

## Solution
Re-enable the mood selector as a visible step between the Welcome/Consent screen and the interview questions. This restores the empathetic "check-in" moment that sets the tone for the conversation.

## What Changes

### 1. Show the Mood Selector in the normal flow
**File:** `src/components/employee/FocusedInterviewInterface.tsx`

Currently, `showMoodSelector` is initialized to `minimalUI` (only true in demo mode). Change it so the mood selector always shows at the start, regardless of mode:
- Set `showMoodSelector` initial state to `true` (instead of `minimalUI`)
- Remove or adjust the `useEffect` (around line 202) that auto-skips mood selection when coming from the WelcomeScreen, since the mood selector will now handle this

### 2. Remove the silent localStorage fallback
**File:** `src/components/employee/FocusedInterviewInterface.tsx`

The `useEffect` that reads `spradley_initial_mood` from localStorage and auto-starts without showing the selector will be updated. Instead of silently defaulting to mood 3 and skipping to the transition, this path will now show the mood selector so the employee can make a choice.

### 3. Keep demo mode behavior intact
The `skipIntro` / `minimalUI` flow will continue to work exactly as before -- the mood selector will still show in demo mode since `showMoodSelector` will now always start as `true`.

## Technical Details

### Current flow (broken)
```text
WelcomeScreen -> FocusedInterviewInterface
                   -> useEffect detects no mood selector shown
                   -> reads localStorage (empty) -> defaults to mood 3
                   -> shows MoodTransition -> starts interview
```

### Restored flow
```text
WelcomeScreen -> FocusedInterviewInterface
                   -> MoodSelector shown ("How's work been this week?")
                   -> Employee clicks emoji
                   -> MoodTransition animation
                   -> Interview begins with mood-aware first question
```

### Changes in detail

**`src/components/employee/FocusedInterviewInterface.tsx`:**
- Line 37: Change `useState(minimalUI)` to `useState(true)` so the mood selector always shows
- Lines 202-210: Remove or disable the `useEffect` that auto-initializes when `showMoodSelector` is false, since the selector will now always be shown first

No other files need changes. The `MoodSelector` component, `MoodTransition`, and the rest of the interview flow are all already wired up correctly.
