

## Plan: Integrate FocusedInterviewInterface with useInterviewCompletion Hook

### Overview
Refactor `FocusedInterviewInterface.tsx` to use the shared `useInterviewCompletion` hook, eliminating duplicate completion logic and ensuring consistent behavior with `ChatInterface`.

---

### Current State Analysis

**FocusedInterviewInterface has its own:**
- Local `ThemeProgress` interface (lines 22-27) - duplicates `src/types/interview.ts`
- Local completion states: `isInCompletionPhase`, `structuredSummary` (lines 67-73)
- Local handlers: `handleFinishEarly`, `handleCompleteFromButtons`, `handleAddMoreFromButtons` (lines 365-429)
- Separate dialog state: `showFinishDialog` (line 61)

**useInterviewCompletion hook provides:**
- Unified `phase` state (`active` | `reviewing` | `complete`)
- `structuredSummary` management
- `themeProgress` from backend
- `isFinishDialogOpen` state
- `handleFinishEarlyClick`, `handleConfirmFinishEarly`, `handleAddMore`, `handleComplete`
- `enterReviewingPhase` for natural completion

---

### Part 1: Import Shared Types and Hook

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

Remove local duplicate types and import from shared:

| Remove | Replace With |
|--------|--------------|
| Local `Message` interface (lines 17-20) | `import type { Message } from "@/types/interview"` |
| Local `ThemeProgress` interface (lines 22-27) | `import type { ThemeProgress, StructuredSummary } from "@/types/interview"` |
| Local `structuredSummary` state type (lines 68-72) | Use `StructuredSummary` from import |

Add hook import:
```typescript
import { useInterviewCompletion } from "@/hooks/useInterviewCompletion";
```

---

### Part 2: Replace Local Completion State with Hook

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

**Remove these local states:**
- `isInCompletionPhase` (line 67)
- `structuredSummary` (lines 68-72)
- `showFinishDialog` (line 61)

**Add hook call:**
```typescript
const {
  phase,
  isActive,
  isReviewing,
  structuredSummary,
  themeProgress: hookThemeProgress,
  isFinishDialogOpen,
  isProcessing,
  handleFinishEarlyClick,
  handleCancelFinishEarly,
  handleConfirmFinishEarly,
  handleAddMore,
  handleComplete,
  enterReviewingPhase,
  updateThemeProgress,
} = useInterviewCompletion({
  conversationId,
  isPreviewMode,
  previewSurveyData,
  publicLinkId,
  onComplete,
});
```

**Keep local `themeProgress` state for initialization, but sync with hook:**
- The hook's `updateThemeProgress` will be called when API returns theme progress
- Use hook's `themeProgress` for display, local for pending state during transitions

---

### Part 3: Update Handler Logic

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

**Remove these handlers:**
- `handleFinishEarly` (lines 365-418) → Use `handleConfirmFinishEarly` from hook
- `handleCompleteFromButtons` (lines 421-423) → Use `handleComplete` from hook
- `handleAddMoreFromButtons` (lines 425-429) → Use `handleAddMore` from hook

**Update `handleSubmit` to use hook's enterReviewingPhase:**
When `data.shouldComplete || data.isCompletionPrompt`:
```typescript
// Instead of setting local state:
// setIsInCompletionPhase(true);
// setStructuredSummary(data.structuredSummary);

// Use hook:
updateThemeProgress(data.themeProgress);
enterReviewingPhase(data.structuredSummary, updatedHistory);
return;
```

**Update theme progress updates:**
When API returns `data.themeProgress`:
```typescript
updateThemeProgress(data.themeProgress);
```

---

### Part 4: Update Dialog References

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

**"Finish Early" button (line 467):**
```typescript
// Before:
onClick={() => setShowFinishDialog(true)}

// After:
onClick={handleFinishEarlyClick}
```

**FinishEarlyConfirmationDialog (lines 552-563):**
```typescript
// Before:
<FinishEarlyConfirmationDialog
  open={showFinishDialog}
  onConfirm={handleFinishEarly}
  onCancel={() => setShowFinishDialog(false)}
  ...
/>

// After:
<FinishEarlyConfirmationDialog
  open={isFinishDialogOpen}
  onConfirm={() => handleConfirmFinishEarly(conversationHistory)}
  onCancel={handleCancelFinishEarly}
  themeCoverage={{ 
    discussed: themeProgress?.discussedCount || questionNumber, 
    total: themeProgress?.totalCount || 6, 
    percentage: themeProgress?.coveragePercent || (questionNumber / 6) * 100 
  }}
  exchangeCount={questionNumber}
  minExchanges={3}
/>
```

---

### Part 5: Update Conditional Rendering

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

**Replace `isInCompletionPhase` checks with `isReviewing`:**

Line 481 (side panel visibility):
```typescript
// Before:
{!isInCompletionPhase && themeProgress && ...}

// After:
{isActive && themeProgress && ...}
```

Line 498 (completion phase display):
```typescript
// Before:
{isInCompletionPhase && structuredSummary && (

// After:
{isReviewing && structuredSummary && (
```

Line 520 (main content visibility):
```typescript
// Before:
{!isInCompletionPhase && (

// After:
{isActive && (
```

Line 543 (footer hint visibility):
```typescript
// Before:
{!isInCompletionPhase && (

// After:
{isActive && (
```

---

### Part 6: Update CompletionConfirmationButtons Props

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

```typescript
// Before (lines 511-515):
<CompletionConfirmationButtons
  onComplete={handleCompleteFromButtons}
  onAddMore={handleAddMoreFromButtons}
  isLoading={isLoading}
/>

// After:
<CompletionConfirmationButtons
  onComplete={handleComplete}
  onAddMore={handleAddMore}
  isLoading={isLoading || isProcessing}
/>
```

---

### Summary of Changes

| Location | Change |
|----------|--------|
| Imports | Add `useInterviewCompletion` hook and shared types |
| State declarations | Remove `isInCompletionPhase`, `structuredSummary`, `showFinishDialog` |
| Hook call | Add `useInterviewCompletion({ ... })` |
| `handleSubmit` | Call `enterReviewingPhase()` instead of setting local state |
| Handlers | Remove local handlers, use hook's handlers |
| JSX conditions | Replace `isInCompletionPhase` with `isReviewing` / `isActive` |
| Dialog | Wire to hook's `isFinishDialogOpen` and handlers |
| Buttons | Wire to hook's `handleComplete` and `handleAddMore` |

---

### Benefits

1. **Single source of truth** - Completion logic defined once in hook
2. **Consistent behavior** - Both interfaces behave identically
3. **Reduced code** - ~60 lines removed from FocusedInterviewInterface
4. **Easier maintenance** - Changes to completion logic only need one update
5. **Type safety** - Shared types ensure API contract consistency
6. **Better testing** - Hook can be tested independently

---

### Testing Checklist

- [ ] Natural completion triggers review phase with summary
- [ ] "Finish Early" button opens confirmation dialog
- [ ] Confirming finish early generates summary and shows review
- [ ] "Add more" returns to active conversation
- [ ] "End conversation" completes and calls onComplete
- [ ] Theme progress displays correctly from hook
- [ ] Voice transcription still works
- [ ] Mood selector and transition still work
- [ ] Preview mode works correctly

