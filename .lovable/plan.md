
Root cause confirmed with direct evidence from runtime traffic and code paths:

1) Why the bar stays fully orange
- In `src/components/employee/FocusedInterviewInterface.tsx`, current progress is:
  - `estimatedTotal = themeProgress ? themeProgress.totalCount * 2.5 : 10`
  - `progressValue = Math.min(((questionNumber + 1) / estimatedTotal) * 100, 100)`
- If `themeProgress.totalCount` is `0`, then `estimatedTotal = 0`, so division yields Infinity and `progressValue` becomes `100` after `Math.min`.
- This makes the bar render as fully filled every time.

2) Why `themeProgress.totalCount` is 0 in your demo
- Network payloads from `/functions/v1/chat` show:
  - request `themes`: `["Work-Life Balance", ...]` (names)
  - response `themeProgress`: `{ themes: [], totalCount: 0 }`
- In `supabase/functions/chat/index.ts` preview logic, the backend treats `request.themes` as theme IDs and queries by `id`.
- Since demo sends names (not IDs), the query returns no rows, so backend sends empty theme progress.

This means the issue is not only the visual bar component. The primary failure is data + denominator safety.

Implementation plan:

1. Harden frontend progress calculation (must-fix)
- File: `src/components/employee/FocusedInterviewInterface.tsx`
- Replace current denominator logic with safe, layered fallback:
  - Prefer backend total if `themeProgress.totalCount > 0`
  - Else if preview survey has themes, use `previewSurveyData.themes.length`
  - Else fallback to a constant (e.g. 10)
- Ensure denominator is never 0.
- Keep per-question increment behavior by using answered-count semantics:
  - `answeredCount = Math.max(0, questionNumber)` or `questionNumber + 1` depending desired start behavior
  - Clamp `progressValue` to `0..100`

2. Make preview theme handling robust in backend (recommended)
- File: `supabase/functions/chat/index.ts`
- In preview mode, normalize incoming `themes`:
  - If array of UUID-like IDs: fetch from `survey_themes` (existing behavior)
  - If array of strings (names): build lightweight in-memory theme objects (`id` generated from index/name hash, `name` from string)
  - If array of objects: map directly (`id/name/description` with safe defaults)
- Use normalized themes for `buildThemeProgress(...)` so `totalCount` is never accidentally zero when themes are present.

3. (Optional but requested-safe) Build a completely independent linear bar
- If you want full isolation from existing UI primitive behavior, create a simple local bar in `FocusedInterviewInterface`:
  - Track div + indicator div using inline `width: ${progressValue}%`
  - CSS transition for smooth per-question animation
- This avoids any dependency on Radix indicator transform mechanics for this specific flow.
- Keep this as fallback if you prefer certainty over reuse.

4. Align behavior to “progress a little bit with every answer”
- Count one increment per submitted user answer.
- Do not rely on backend theme detection timing for immediate visual increment.
- Progress source for this screen should prioritize local question progression; backend theme progress can remain supportive metadata.

5. Validation checklist (end-to-end)
- Demo route `/demo/employee`:
  - On first answer, bar should visibly move (not start at full).
  - Each subsequent answer should increase bar monotonically.
  - No sudden jumps to 100% unless interview is truly near end.
- Preview from HR wizard:
  - Works with theme IDs, theme objects, and plain theme names.
- Regression:
  - Completion/review phase still works.
  - Finish Early flow still works.
  - No NaN/Infinity values in progress style computation.

Technical notes
- Files to update:
  - `src/components/employee/FocusedInterviewInterface.tsx` (required)
  - `supabase/functions/chat/index.ts` (strongly recommended for root-cause fix across preview contexts)
- Key guard to enforce:
  - `const safeTotal = Math.max(1, computedTotal);`
- Keep progress value safe:
  - `const progressValue = Math.min(100, Math.max(0, (answeredCount / safeTotal) * 100));`
