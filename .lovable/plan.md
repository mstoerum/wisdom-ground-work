
## Fix: Stale Closure Bug Preventing Spradley Evaluation

### Problem Identified

The Spradley evaluation is not appearing after completing the DD test survey due to a **stale closure bug** in the React code.

---

### Technical Analysis

**Location**: `src/components/employee/EmployeeSurveyFlow.tsx`

**The Bug**:
```typescript
// Line 150-169: handleChatComplete has empty dependency array
const handleChatComplete = useCallback((chatData?: {...}) => {
  // ...
  handleSurveyComplete(); // ← Calls a function not wrapped in useCallback
}, []); // ← Empty deps = stale closure!

// Line 171-196: handleSurveyComplete is a regular function
const handleSurveyComplete = async () => {
  const enableEvaluation = surveyDetails?.consent_config?.enable_spradley_evaluation;
  // ↑ Uses surveyDetails which may change after initial render
  
  if (enableEvaluation && !isPreviewMode && conversationId) {
    setStep("evaluation"); // Should show evaluation
  } else {
    setStep("complete"); // Skips evaluation
  }
};
```

**What happens**:
1. Component mounts, `handleChatComplete` captures the initial `handleSurveyComplete` reference
2. Survey data loads asynchronously via React Query in `PublicSurvey.tsx`
3. `surveyDetails` updates with correct `consent_config`
4. But `handleChatComplete` still holds the OLD `handleSurveyComplete` where `surveyDetails` was incomplete
5. When user completes survey, the stale function runs with `undefined` consent_config
6. `enableEvaluation` evaluates to `undefined`/`false` → evaluation skipped

---

### Solution

Convert `handleSurveyComplete` to `useCallback` and fix the dependency chain:

```typescript
// 1. Wrap handleSurveyComplete in useCallback with proper dependencies
const handleSurveyComplete = useCallback(async () => {
  const enableEvaluation = surveyDetails?.consent_config?.enable_spradley_evaluation;
  
  if (enableEvaluation && !isPreviewMode && conversationId) {
    setStep("evaluation");
  } else {
    if (!isPreviewMode) {
      await endConversation(null);
    }
    setStep("complete");
    
    toast({
      title: isPreviewMode ? "Preview Complete!" : "Thank you!",
      description: isPreviewMode
        ? "You've experienced the complete employee survey journey."
        : "Your feedback has been recorded.",
    });

    setTimeout(() => {
      onComplete?.();
    }, isPreviewMode ? 1000 : 2000);
  }
}, [surveyDetails, isPreviewMode, conversationId, endConversation, toast, onComplete]);

// 2. Update handleChatComplete to include handleSurveyComplete in deps
const handleChatComplete = useCallback((chatData?: {...}) => {
  if (chatData) {
    const duration = Math.floor((Date.now() - conversationStartTime.current) / 1000);
    setInterviewContext(prev => ({
      ...prev,
      themesDiscussed: chatData.themesDiscussed || [],
      exchangeCount: chatData.exchangeCount || 0,
      overallSentiment: chatData.sentiment || 'neutral',
      duration,
    }));
  }
  
  handleSurveyComplete();
}, [handleSurveyComplete]); // ← Now properly depends on handleSurveyComplete
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/employee/EmployeeSurveyFlow.tsx` | Wrap `handleSurveyComplete` in `useCallback`, update dependency arrays for all callbacks |

---

### Implementation Steps

1. **Convert `handleSurveyComplete` to `useCallback`**
   - Add dependencies: `surveyDetails`, `isPreviewMode`, `conversationId`, `endConversation`, `toast`, `onComplete`

2. **Update `handleChatComplete` dependencies**
   - Add `handleSurveyComplete` to the dependency array

3. **Also fix `handleEvaluationComplete` and `handleEvaluationSkip`**
   - These similarly need to be wrapped with proper dependencies

---

### Additional Observation

The conversation session shows `status: active` and `ended_at: null`. This suggests one of two things:
1. The stale closure bug caused `handleComplete` to never run properly
2. OR the user closed the browser before clicking "Complete Session"

Either way, fixing the stale closure issue will ensure the evaluation appears when the survey is properly completed.

---

### Testing Plan

1. Complete the DD test survey via `/survey/896a760522aa414b`
2. Answer all questions and wait for the Summary Receipt
3. Click "Complete Session" button
4. **Expected**: FocusedEvaluation component should appear
5. Complete the evaluation questions
6. Verify `spradley_evaluations` table has a new record
