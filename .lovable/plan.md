

## Plan: Remove Finish Early, Skip Question, and FinishEarlyConfirmationDialog

### 1. `src/components/employee/FocusedInterviewInterface.tsx`
- **Remove imports**: `CheckCircle`, `FinishEarlyConfirmationDialog`
- **Remove unused hook destructures**: `isFinishDialogOpen`, `handleFinishEarlyClick`, `handleCancelFinishEarly`, `handleConfirmFinishEarly`
- **Remove the header section** (lines 415-432) containing the "Finish Early" button — or simplify it to just the border div
- **Remove `onSkip` prop** from `InteractiveInputRouter` (line 468)
- **Remove the `FinishEarlyConfirmationDialog`** block at the bottom (lines 486-498)

### 2. `src/components/employee/ChatInterface.tsx`
- **Remove imports**: `FinishEarlyConfirmationDialog`, `CheckCircle` (if only used for Finish Early)
- **Remove `handleFinishEarlyClick`** callback (lines 364-367)
- **Remove `isFinishDialogOpen`/`setFinishDialogOpen` state** and related references
- **Remove the Finish Early button** (lines 474-483)
- **Remove the `FinishEarlyConfirmationDialog`** block (lines 613-621)

### 3. No file deletion
Keep `FinishEarlyConfirmationDialog.tsx` in the codebase as dead code for now (can be cleaned up later if desired).

