

## Plan: Enhanced SummaryReceipt - Single-Screen Completion Experience

### Overview
Combine `SummaryReceipt` with `ClosingRitual` into one cohesive component that shows the personalized summary, "What happens next" information, and final action buttons. Eliminate the separate `ClosingRitual` step entirely.

---

### Current Flow (Problematic)

```text
┌─────────────┐     ┌───────────────┐     ┌────────────────┐     ┌──────────────┐
│  Chat       │ ──► │ SummaryReceipt │ ──► │ ClosingRitual  │ ──► │ Complete     │
│  (Active)   │     │ + Buttons     │     │ (Generic)      │     │ Thank You    │
└─────────────┘     └───────────────┘     └────────────────┘     └──────────────┘
                         ▲                      ▲
                         │                      │
                    Shows personalized      Shows generic
                    summary + points        "Thank you" + 
                                           "What happens next"
                                           (Summary is LOST!)
```

**Problems:**
1. 4 screens to complete (too many clicks)
2. Personalized summary disappears when moving to ClosingRitual
3. ClosingRitual is generic with no connection to user's actual feedback

---

### New Flow (Approach A)

```text
┌─────────────┐     ┌──────────────────────────────────────┐     ┌──────────────┐
│  Chat       │ ──► │ Enhanced SummaryReceipt              │ ──► │ Complete     │
│  (Active)   │     │ • Personalized summary               │     │ (or Eval)    │
│             │     │ • What happens next                  │     │              │
│             │     │ • [Add More] [Complete Session] btns │     │              │
└─────────────┘     └──────────────────────────────────────┘     └──────────────┘
```

**Benefits:**
- 1 fewer screen (summary + closing combined)
- Personalized summary visible until the very end
- Clear action path with prominent completion button

---

### Part 1: Enhance SummaryReceipt Component

**File: `src/components/employee/SummaryReceipt.tsx`**

Add new props to accept completion handlers and survey context:

```typescript
interface SummaryReceiptProps {
  conversationId: string;
  structuredSummary: StructuredSummary;
  responseCount: number;
  startTime?: Date;
  // NEW: Make it a complete ending screen
  surveyType?: 'employee_satisfaction' | 'course_evaluation';
  showCompletionFlow?: boolean; // When true, include "What happens next" + buttons
  onComplete?: () => void;
  onAddMore?: () => void;
  isLoading?: boolean;
}
```

**New sections to add when `showCompletionFlow` is true:**

1. **"What Happens Next" section** (moved from ClosingRitual)
2. **Action buttons** ("Add more" / "Complete Session")

The existing content remains unchanged - this is additive.

---

### Part 2: Update SummaryReceipt Layout

**File: `src/components/employee/SummaryReceipt.tsx`**

New structure when `showCompletionFlow={true}`:

```text
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Your Voice Has Been Heard                                   │
│    Thank you for sharing your thoughts                          │
├─────────────────────────────────────────────────────────────────┤
│  ❤️ "We appreciate you taking the time to share..."             │ ← Opening
│                                                                 │
│  📝 What You Shared                                             │ ← Key Points
│  • Mentioned challenges with team communication...              │
│  • Expressed interest in growth opportunities...                │
│  • Highlighted positive experience with...                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  🔒 Anonymous • 5 responses • ~7 min                            │ ← Stats
├─────────────────────────────────────────────────────────────────┤
│  ❤️ What happens next?                                          │ ← NEW
│  • Your feedback is analyzed with others to find trends         │
│  • Leadership reviews aggregated insights                       │
│  • Action plans are developed based on common themes            │
├─────────────────────────────────────────────────────────────────┤
│  Does this capture everything?                                  │ ← Inline
│  [Add more]              [Complete Session]                     │ ← Buttons
└─────────────────────────────────────────────────────────────────┘
```

---

### Part 3: Update FocusedInterviewInterface

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

Replace separate `SummaryReceipt` + `CompletionConfirmationButtons` with integrated version:

**Before (lines 426-445):**
```tsx
{isReviewing && structuredSummary && (
  <motion.div ...>
    <SummaryReceipt
      conversationId={conversationId}
      structuredSummary={structuredSummary}
      responseCount={questionNumber}
      startTime={conversationStartTime}
    />
    <CompletionConfirmationButtons
      onComplete={handleComplete}
      onAddMore={handleAddMore}
      isLoading={isLoading || isProcessing}
    />
  </motion.div>
)}
```

**After:**
```tsx
{isReviewing && structuredSummary && (
  <motion.div ...>
    <SummaryReceipt
      conversationId={conversationId}
      structuredSummary={structuredSummary}
      responseCount={questionNumber}
      startTime={conversationStartTime}
      showCompletionFlow={true}
      surveyType="employee_satisfaction"
      onComplete={handleComplete}
      onAddMore={handleAddMore}
      isLoading={isLoading || isProcessing}
    />
  </motion.div>
)}
```

---

### Part 4: Update ChatInterface

**File: `src/components/employee/ChatInterface.tsx`**

Apply the same pattern - use enhanced `SummaryReceipt` with `showCompletionFlow={true}`.

Find the `SummaryReceipt` + `CompletionConfirmationButtons` usage and consolidate.

---

### Part 5: Skip ClosingRitual Step in Parent Components

**File: `src/components/employee/EmployeeSurveyFlow.tsx`**

Update `handleChatComplete` to skip directly to evaluation (if enabled) or complete:

**Before:**
```tsx
const handleChatComplete = () => {
  setStep("closing");  // Goes to ClosingRitual
};
```

**After:**
```tsx
const handleChatComplete = () => {
  // Skip closing ritual - now handled in SummaryReceipt
  handleSurveyComplete();  // Go directly to evaluation or complete
};
```

Remove the `{step === "closing" && ...}` rendering block since it's no longer needed.

---

**File: `src/pages/employee/Dashboard.tsx`**

Apply same change - skip closing step:

**Before:**
```tsx
const handleChatComplete = () => {
  setStep("closing");
};
```

**After:**
```tsx
const handleChatComplete = () => {
  // Skip closing ritual - handled in SummaryReceipt
  handleComplete(mood);  // Go directly to complete
};
```

Remove the `{step === "closing" && ...}` rendering block.

---

### Part 6: Pass Survey Type Through the Flow

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

Add `surveyType` prop to receive from parent:

```tsx
interface FocusedInterviewInterfaceProps {
  conversationId: string;
  onComplete: () => void;
  onSaveAndExit: () => void;
  publicLinkId?: string;
  minimalUI?: boolean;
  surveyType?: 'employee_satisfaction' | 'course_evaluation'; // NEW
}
```

**File: `src/components/employee/EmployeeSurveyFlow.tsx`**

Pass through:
```tsx
<FocusedInterviewInterface
  conversationId={conversationId}
  onComplete={handleChatComplete}
  onSaveAndExit={handleSaveAndExit}
  publicLinkId={publicLinkId}
  minimalUI={skipIntro}
  surveyType={surveyDetails?.survey_type}  // NEW
/>
```

---

### Part 7: Update useInterviewCompletion Hook

**File: `src/hooks/useInterviewCompletion.ts`**

The hook's `handleComplete` now needs to be what triggers the final step. No changes needed since it already calls `onComplete()` callback.

However, we need to add an optional `skipClosingRitual` return value or config:

Actually, the hook is fine as-is. The parent components just need to wire `onComplete` differently.

---

### Part 8: Remove ClosingRitual Import (Cleanup)

**Files to update:**
- `src/components/employee/EmployeeSurveyFlow.tsx` - Remove import and usage
- `src/pages/employee/Dashboard.tsx` - Remove import and usage

The `ClosingRitual.tsx` file can be kept for now (not deleted) in case it's referenced elsewhere, but it will no longer be used in the main flow.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/employee/SummaryReceipt.tsx` | Add completion flow props, "What happens next" section, inline buttons |
| `src/components/employee/FocusedInterviewInterface.tsx` | Use enhanced SummaryReceipt with completion flow, add surveyType prop |
| `src/components/employee/ChatInterface.tsx` | Use enhanced SummaryReceipt with completion flow |
| `src/components/employee/EmployeeSurveyFlow.tsx` | Skip closing step, remove ClosingRitual, pass surveyType |
| `src/pages/employee/Dashboard.tsx` | Skip closing step, remove ClosingRitual |
| `ConversationStep` type | Remove "closing" from allowed values |

---

### Technical Notes

**Backward Compatibility:**
- `showCompletionFlow` defaults to `false` so existing usages (if any) won't break
- `onComplete` and `onAddMore` are optional

**Animation Continuity:**
- The motion.div wrapper around SummaryReceipt already handles enter animations
- Adding the "What happens next" section uses the same staggered delay pattern

**Survey Type Handling:**
- Course evaluation shows: "Instructors review insights to improve the course"
- Employee satisfaction shows: "Leadership reviews aggregated insights"

---

### Testing Checklist

- [ ] FocusedInterviewInterface: Natural completion shows enhanced receipt with "What happens next"
- [ ] FocusedInterviewInterface: "Add more" returns to active conversation
- [ ] FocusedInterviewInterface: "Complete Session" triggers evaluation (if enabled) or final thank you
- [ ] ChatInterface: Same completion flow works
- [ ] Dashboard: Completing survey goes directly to final (no ClosingRitual)
- [ ] EmployeeSurveyFlow: Public links complete properly
- [ ] Course evaluation: Shows correct "what's next" messaging
- [ ] Employee satisfaction: Shows correct "what's next" messaging
- [ ] Preview mode: Works correctly

