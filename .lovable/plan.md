

# Fix: Ensure Progress Bar Advances Visibly Per Question

## Problem

The progress bar calculation uses `questionNumber` which starts at 0 and increments after each answer, but the estimated total may be too high (e.g., 12 for 4 themes), making each step feel tiny or invisible — especially at the start.

## Solution

In `src/components/employee/FocusedInterviewInterface.tsx`, adjust the progress calculation:

1. **Start with a small initial value** (e.g., 5%) so the bar is visible from the very first question
2. **Use a slightly lower estimated total** — `totalCount * 2.5` instead of `* 3` — so each answer creates a more noticeable jump
3. **Count from 1** by using `questionNumber + 1` so the first answered question already shows progress

Updated calculation (around line 463):
```typescript
const estimatedTotal = themeProgress ? themeProgress.totalCount * 2.5 : 10;
const progressValue = Math.min(((questionNumber + 1) / estimatedTotal) * 100, 100);
```

For a 4-theme survey this gives ~10% per question answered (vs ~8% before), and the bar starts at 10% rather than 0%.

## Files Changed

| File | Change |
|------|--------|
| `src/components/employee/FocusedInterviewInterface.tsx` | Tweak progress formula to start visible and increment noticeably per answer |

