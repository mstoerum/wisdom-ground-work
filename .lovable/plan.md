

Update the textarea in `AnswerInput.tsx` to replace the focus ring/border with a box-shadow effect on focus.

**Change in `src/components/employee/AnswerInput.tsx`** (line ~111):
- Remove `focus:ring-2 focus:ring-foreground/20 focus:border-foreground` classes
- Add `focus:shadow-[0_0_0_4px_rgba(66,49,49,0.06)]` and `focus:outline-none` so clicking the box produces a soft shadow glow instead of a stroke
- Keep the existing subtle border color via the inline style
