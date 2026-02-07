

# Replace Hover Tooltip with Click-to-Reveal Question Context

## The Problem

The current "Q" badge uses a Tooltip (hover-only), which:
- Only shows a question mark on hover, not the actual question content
- Doesn't work on touch/mobile devices
- Is easy to miss entirely

## The Fix

Replace the Tooltip with a **click-to-toggle inline reveal**. When you click the quote (or a small "Q" badge), the question slides open directly below the quote text, keeping everything unified in one block.

**Before (hover -- broken):**
```
"I love my team but spend 4-5hrs in meetings..." [Q]
```

**After (click to expand):**
```
"I love my team but spend 4-5hrs in meetings..."  [Q]
  Asked: "How does your typical workday flow?"
```

Clicking again (or clicking another quote) collapses it. The question text appears with a subtle slide-down animation, visually nested under the quote with slightly muted styling.

## Technical Changes

### `src/components/hr/analytics/ThemeDetailView.tsx`

- Remove the `Tooltip` / `TooltipProvider` / `TooltipTrigger` / `TooltipContent` imports
- Add `useState` to track which quote index is expanded (or `null`)
- Replace the tooltip markup with:
  - The "Q" badge becomes a clickable button that toggles the expanded state
  - Below the quote text, render a conditionally visible question line with a small slide animation (using framer-motion `AnimatePresence`)
  - Style: smaller text, muted color, prefixed with "Asked:" to clearly label it
- Clicking a different quote's "Q" auto-collapses the previous one (only one open at a time)
- Remove unused `HelpCircle` import if present

No other files need changes -- this is purely a presentation update within the quote section.

