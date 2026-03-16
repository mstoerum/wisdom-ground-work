

## Plan: Remove Summary Receipt from Completion Flow

Remove the `SummaryReceipt` rendering from both interview interfaces. When the backend signals completion, skip the reviewing phase entirely and go straight to completing the session.

### Changes

**1. `src/components/employee/FocusedInterviewInterface.tsx`**
- Remove the `SummaryReceipt` import
- Remove the `SummaryReceipt` rendering block (reviewing phase UI)
- When backend signals completion (`isCompletionPrompt`), call `handleComplete` directly instead of entering the reviewing phase

**2. `src/components/employee/ChatInterface.tsx`**
- Remove the `SummaryReceipt` import
- Remove the `SummaryReceipt` rendering block and the fallback completion alert
- Same logic: skip reviewing, go straight to complete

**3. `src/hooks/useInterviewCompletion.ts`**
- Simplify `enterReviewingPhase` to just call `handleComplete` directly (or remove the reviewing phase entirely)
- The `handleConfirmFinishEarly` flow should also skip reviewing and go to complete

**4. No backend changes needed** — the `structuredSummary` data can still be generated and stored server-side for analytics, it just won't be displayed.

