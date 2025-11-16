# Survey Preview Mode Error Analysis

## Issues Identified

### 1. **Race Condition in Preview Data Loading**
When preview dialog opens without `surveyId`, the effect that constructs preview data may not complete before rendering starts, leaving `loadedSurveyData` as `null`.

### 2. **Form Data May Be Uninitialized**
If user clicks "Preview" before form defaults have fully loaded from `surveyDefaults`, the form fields may return `undefined`, causing consent_config to have undefined values.

### 3. **Missing Error Boundary Coverage**
The `CompleteEmployeeExperiencePreview` has error boundary for the child components, but not for the initial data validation phase.

### 4. **Insufficient Fallback Validation**
While the code tries to provide defaults, there are edge cases where `surveyData` properties might be `null` or improperly shaped objects rather than `undefined`.

### 5. **Potential Issue with QuickPreview Flow**
The quickPreview flow that skips mode selection and mood dial calls `startConversation` directly, but if this fails for any reason, the step still changes to "chat" without a valid conversationId.

## Root Causes

### Timing Issue
```typescript
// CreateSurvey.tsx - form.watch() may return undefined
<CompleteEmployeeExperiencePreview
  surveyData={{
    consent_config: {
      consent_message: form.watch("consent_message"), // ← May be undefined!
    },
  }}
/>
```

### Race Condition
```typescript
// CompleteEmployeeExperiencePreview.tsx - Effect runs but data may not be ready
useEffect(() => {
  if (!open) return;
  // ... validation and construction
  setLoadedSurveyData(constructedData);
}, [fullSurveyData, surveyData, surveyId, open, queryError]);

// Meanwhile, render happens:
{loadedSurveyData && loadedSurveyData.consent_config ? (
  // Render preview
) : (
  // Show error! ← This happens when data isn't ready yet
)}
```

### StartConversation Failure
```typescript
// EmployeeSurveyFlow.tsx
const sessionId = await startConversation(surveyId, 50, publicLinkId);
if (sessionId) {
  setStep("chat");
}
// But conversationId state might not update immediately, causing render issues
```
