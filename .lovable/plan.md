

# Add Linear Progress Bar to Interview Interface

## Overview

Replace the current `AmbientArc` segmented progress visualization with the new `Progress` (linear bar) component. The bar fills left-to-right based on how many questions remain, calculated from `questionNumber` relative to the estimated total (derived from theme count).

## Changes

### `src/components/employee/FocusedInterviewInterface.tsx`

1. **Import** `Progress` from `@/components/ui/progress` (replace or keep `AmbientArc` import)
2. **Calculate progress value**: `Math.min((questionNumber / estimatedTotal) * 100, 100)` where `estimatedTotal` comes from `themeProgress?.totalCount * 3` (roughly 3 questions per theme) or falls back to a default of 12
3. **Replace the AmbientArc block** (lines 461-464) with:
   - A `Progress` component spanning full width at the top of the active interview area
   - Subtle styling: thin bar (h-1 or h-1.5), rounded, with the primary color indicator
   - Optional small label like "3 of ~12" in muted text below

### Visual Design

- Thin horizontal bar at the top of the interview content area
- Fills smoothly left-to-right as questions are answered
- Uses the existing `Progress` component with `value` prop (0-100)
- Animated via the built-in CSS transition (`transition-all`)
- Minimal footprint — no text label needed, just the bar itself (the existing footer hint already says "Press Enter to continue")

### Progress Calculation

The estimated total questions uses theme data when available:
```
const estimatedTotal = themeProgress 
  ? themeProgress.totalCount * 3   // ~3 exchanges per theme
  : 12;                             // fallback
const progressValue = Math.min((questionNumber / estimatedTotal) * 100, 100);
```

This means for a 4-theme survey (estimatedTotal = 12), answering 6 questions shows 50% progress.

## Files Changed

| File | Change |
|------|--------|
| `src/components/employee/FocusedInterviewInterface.tsx` | Replace `AmbientArc` with `Progress` bar, add progress calculation |

