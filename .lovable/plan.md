

# Chat Engine Selection and Duration Prompt for chat-v2

## Overview
Add a setting in the survey creation wizard that lets HR admins choose which interview engine to use ("Standard" using the `chat` function, or "Adaptive" using `chat-v2`). When `chat-v2` is selected, the employee will see a duration selector at the start of the interview instead of jumping straight into questions.

## What Changes

### 1. Database: Add `chat_engine` column to `surveys` table
- New column: `chat_engine` (text, default `'standard'`, values: `'standard'` or `'adaptive'`)
- Stored inside the survey record so the frontend knows which backend function to call.

### 2. Survey Schema: Add `chat_engine` field
**File:** `src/lib/surveySchema.ts`
- Add `chat_engine: z.enum(['standard', 'adaptive'])` to the Zod schema
- Default value: `'standard'`

### 3. Survey Creation Wizard: New "Interview Engine" selector
**File:** `src/components/hr/wizard/ConsentSettings.tsx` (or a new section in the Privacy/Settings step)
- Add a simple radio/select control with two options:
  - **Standard** -- "Classic interview flow with automatic pacing" (uses `chat` function)
  - **Adaptive** -- "Employee chooses their time commitment upfront" (uses `chat-v2` function)
- Brief description under each option explaining the difference

### 4. Save `chat_engine` to database
**File:** `src/pages/hr/CreateSurvey.tsx`
- Include `chat_engine` in the `surveyData` object sent to Supabase when saving drafts
- Store it as a top-level column on the `surveys` table

### 5. Frontend: Route to correct backend function based on `chat_engine`
**File:** `src/hooks/useChatAPI.ts`
- Accept a new `chatEngine` option (`'standard' | 'adaptive'`)
- Change the fetch URL from hardcoded `/functions/v1/chat` to either `/functions/v1/chat` or `/functions/v1/chat-v2` based on this value

### 6. Pass `chat_engine` through the component chain
- `EmployeeSurveyFlow` reads `surveyDetails.chat_engine` and passes it down
- `FocusedInterviewInterface` receives and forwards it to `useChatAPI`

### 7. Duration Selector in chat-v2 flow
**Existing file:** `src/components/employee/DurationSelector.tsx` (already built)
**File:** `src/components/employee/FocusedInterviewInterface.tsx`
- When `chatEngine === 'adaptive'` and the backend returns `phase: "duration_selection"`, show the `DurationSelector` component
- On selection, send the `selectedDuration` to the `chat-v2` function which already handles it (lines 361-417 of chat-v2)

### 8. Load draft: restore `chat_engine` from existing survey data
**File:** `src/pages/hr/CreateSurvey.tsx`
- When loading a draft, read `chat_engine` from the survey record and set it on the form

## Technical Details

### Database Migration
```sql
ALTER TABLE public.surveys
ADD COLUMN chat_engine text NOT NULL DEFAULT 'standard';
```

### Data Flow
```text
HR creates survey → selects "Adaptive" engine → saved as chat_engine='adaptive'
Employee opens survey → frontend reads chat_engine → calls /functions/v1/chat-v2
chat-v2 returns phase="duration_selection" → DurationSelector shown
Employee picks 10 min → sent as selectedDuration → chat-v2 starts interview with time-aware pacing
```

### chat-v2 Already Handles Duration
The `chat-v2` edge function already has:
- Duration selection phase (returns `phase: "duration_selection"` on `[START_CONVERSATION]`)
- Duration targets mapping (5/10/15 min to exchange counts)
- Time-aware pacing logic
- Theme selection support

No changes needed to the `chat-v2` edge function itself.

### Files Modified
1. `src/lib/surveySchema.ts` -- add `chat_engine` field
2. `src/pages/hr/CreateSurvey.tsx` -- save/load `chat_engine`
3. `src/components/hr/wizard/ConsentSettings.tsx` -- add engine selector UI
4. `src/hooks/useChatAPI.ts` -- route to correct function
5. `src/components/employee/FocusedInterviewInterface.tsx` -- handle duration_selection phase
6. `src/components/employee/EmployeeSurveyFlow.tsx` -- pass chatEngine prop

### New Database Migration
- Add `chat_engine` column to `surveys` table

