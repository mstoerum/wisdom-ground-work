

# Simulate Progress Bar Advancement with White/Orange Styling

## Overview

Make the progress bar visually advance one step each time a question is answered, and style it with a white track and orange fill indicator.

## Changes

### `src/components/employee/FocusedInterviewInterface.tsx` (lines 462-469)

Update the progress bar styling to use a white background track and orange indicator:

```tsx
<div className="absolute top-0 left-0 right-0 px-6">
  <Progress 
    value={progressValue} 
    className="h-1.5 bg-white" 
    indicatorClassName="bg-orange-500"
  />
</div>
```

The existing calculation already increments `questionNumber` after each answer, so `progressValue` already advances per question. The formula `((questionNumber + 1) / estimatedTotal) * 100` ensures visible steps. No logic changes needed -- only the colors.

### Summary

| File | Change |
|------|--------|
| `src/components/employee/FocusedInterviewInterface.tsx` | Add `bg-white` to Progress root, `bg-orange-500` to indicator via `indicatorClassName` prop |

