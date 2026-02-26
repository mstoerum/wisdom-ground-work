
Goal: Make the interview progress bar visibly advance on every question step and prevent the “always fully orange” failure state.

What I found:
- The bar is rendered in `src/components/employee/FocusedInterviewInterface.tsx` using:
  - `estimatedTotal = themeProgress ? themeProgress.totalCount * 2.5 : 10`
  - `progressValue = Math.min(((questionNumber + 1) / estimatedTotal) * 100, 100)`
- The visual fill in `src/components/ui/progress.tsx` depends entirely on:
  - `style={{ transform: translateX(...) }}`
- If `progressValue` becomes `NaN` or `Infinity` (for example when `themeProgress` exists but `totalCount` is `0`, missing, or invalid), the computed transform becomes invalid, and the indicator (which is `w-full`) appears as a permanently full orange bar.

Implementation approach:
1. Harden progress math in `FocusedInterviewInterface`
   - Introduce a safe `themeCount`:
     - Only accept finite numeric counts greater than 0
     - Otherwise fallback to default (e.g. `4` themes)
   - Compute `estimatedTotal` from safe count and clamp to minimum 1
   - Compute `progressValue` with numeric guards:
     - finite check
     - clamp to `[0, 100]`
   - Preserve current behavior of stepping per answered question (`questionNumber + 1`) so each exchange advances.

2. Harden rendering logic in shared `Progress` component
   - Normalize incoming `value` in `src/components/ui/progress.tsx`:
     - fallback to `0` when invalid
     - clamp to `[0, 100]`
   - Use this normalized value for transform.
   - This creates a second safety net so invalid callers cannot force a permanently full bar.

3. Keep requested styling explicit
   - In `FocusedInterviewInterface`, keep:
     - Track: white (`bg-white`)
     - Indicator: orange (`bg-orange-500`)
   - Do not alter other progress variants (`ProgressCircle`, `ProgressRadial`).

Files to update:
- `src/components/employee/FocusedInterviewInterface.tsx`
  - Replace raw estimate/value math with guarded + clamped calculations.
- `src/components/ui/progress.tsx`
  - Add safe normalization for `value` before transform.

Validation plan:
- Functional checks in `/demo/employee`:
  1. On first question display, bar is partially filled (not full).
  2. After each submitted answer, bar increases by a visible step.
  3. Bar never jumps to full unless truly near completion.
- Edge-case checks:
  - Force scenario where theme metadata is missing/empty and verify bar still starts low and progresses safely.
  - Confirm no regressions in components using `Progress` elsewhere.
- Visual check:
  - Ensure track is white and fill remains orange in interview UI.

Technical notes:
- This fix addresses both root causes:
  - upstream invalid totals in interview math
  - downstream lack of defensive handling in shared progress primitive
- The combination makes the progress system resilient even if backend payload shape varies across chat modes.
