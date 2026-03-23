

## Fix mobile overflow for long AI messages and chips

The problem: on mobile, the `AIResponseDisplay` text uses `text-xl md:text-2xl` which is still too large for long intro/closing messages, and the `WordCloudSelector` chips don't wrap well on narrow screens. The container also uses fixed `px-6` padding and `max-w-2xl` which doesn't adapt.

### Changes

**1. `src/components/employee/AIResponseDisplay.tsx`**

- Scale font sizes down on mobile: change from `text-xl md:text-2xl` to `text-base sm:text-lg md:text-2xl` on both the ghost text (line 78) and the visible overlay (line 88)
- Same for the question span (line 99): `text-base sm:text-lg md:text-2xl` instead of hard `text-2xl`
- Change container `px-4` to `px-2 sm:px-4` for tighter mobile margins

**2. `src/components/employee/inputs/WordCloudSelector.tsx`**

- Reduce chip text and padding on mobile: change `px-4 py-2.5 text-sm` to `px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm` (lines 80, 100)
- Reduce container max-width on mobile: `max-w-[95vw] sm:max-w-2xl`

**3. `src/components/employee/FocusedInterviewInterface.tsx`**

- Reduce main content padding on mobile: change `px-6 py-8 gap-8` (line 451) to `px-3 py-4 gap-4 sm:px-6 sm:py-8 sm:gap-8`
- Same for progress bar container `px-6` (line 462) → `px-3 sm:px-6`

**4. `src/components/employee/AnswerInput.tsx`**

- Reduce textarea and button sizing on mobile: change `text-lg` → `text-base sm:text-lg`, button `text-lg px-8 py-6` → `text-base px-6 py-4 sm:text-lg sm:px-8 sm:py-6`

These are all class-only changes — no logic modifications. Existing desktop styling stays identical via the `sm:` / `md:` breakpoints.

