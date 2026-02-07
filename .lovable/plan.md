

# Story Report: 10 Design Fixes from Notion Designer Review

## Fix 1: Remove StoryProgressBar and Footer Counter

The StoryProgressBar and the "1 of 6" text in the navigation footer duplicate information already shown in the StoryJourneyNav. This creates triple redundancy.

**Changes in `NarrativeReportViewer.tsx`:**
- Remove the `<StoryProgressBar>` render (lines 198-201) and its import (line 10)
- Remove the `<span>` showing "X of Y" in the footer (line 215-217)
- Keep the Previous/Next buttons (they serve a real navigation purpose)

## Fix 2: Kill Internal Stagger Animations in StoryChapter

The chapter already slides in via the parent `AnimatePresence` in `NarrativeReportViewer`. Internal stagger animations on the icon, narrative, and insight list cause a "double animation" effect.

**Changes in `StoryChapter.tsx`:**
- Replace the `motion.div` wrapping the icon (lines 95-106) with a plain `div`
- Replace the `motion.div` wrapping the narrative (lines 131-140) with a plain `div`
- Replace each insight's `motion.div` wrapper (lines 150-160) with a plain `div`
- Remove the `motion` import from framer-motion (no longer needed)

## Fix 3: Remove Header motion.div in NarrativeReportViewer

The header section has its own fade-in animation that plays on every chapter change, adding unnecessary motion.

**Changes in `NarrativeReportViewer.tsx`:**
- Replace `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>` (lines 110-114) with a plain `<div>`

## Fix 4: Remove Journey Nav Active Chapter Info Block

The "active chapter info" block below the journey line (lines 128-145 in `StoryJourneyNav.tsx`) repeats the chapter title that is already shown in the chapter card itself. It also shows another "X of Y" counter.

**Changes in `StoryJourneyNav.tsx`:**
- Remove the entire `motion.div` block (lines 128-145) that shows the active chapter title, description, and "X of Y" counter
- This saves ~80px of vertical space

## Fix 5: Restructure InsightCard to Lead with Agreement %

Currently, InsightCard shows text first, then the agreement bar below. For HR scanning multiple insights, the agreement percentage should be the first thing they see.

**Changes in `InsightCard.tsx`:**
- Restructure to a horizontal layout: large agreement percentage number on the left, insight text + metadata on the right
- When no agreement data exists, fall back to the current full-width text layout
- The agreement number becomes a bold, large `text-2xl` element with "agree" label below it
- Remove the separate `AgreementBar` component usage (the number itself is the bar)

## Fix 6: Remove Per-Quote Anonymous Attribution

Every quote in `QuoteCarousel` shows "-- Anonymous" which is redundant -- all responses are anonymous. This wastes space and adds visual noise.

**Changes in `QuoteCarousel.tsx`:**
- Remove the "-- Anonymous" span (lines 80-83)
- Add a single disclaimer at the top of the carousel: "All responses are anonymous" in `text-xs text-muted-foreground`

## Fix 7: Fix Sub-12px Text in QuoteCarousel

Two instances of sub-12px text remain in `QuoteCarousel.tsx`.

**Changes in `QuoteCarousel.tsx`:**
- Line 50: Change `text-[10px]` on urgency indicator to `text-xs`
- Line 81: Change `text-[11px]` on anonymous attribution to `text-xs` (this line is being removed per Fix 6, so only the urgency fix applies)
- Line 90: Change `text-[10px]` on voices count to `text-xs`

## Fix 8: Replace Infinite Pulse with Single-Play Animation

The active chapter node in `StoryJourneyNav` has an infinite pulsing ring that is distracting. A single pulse on selection is sufficient to draw attention.

**Changes in `StoryJourneyNav.tsx`:**
- Change the pulse ring animation (lines 104-109): remove `repeat: Infinity` so it plays once and fades out
- Add a `key` based on `activeIndex` so it replays when the user switches chapters

## Fix 9: Add AlertDialog to AudienceToggle

Switching audience triggers a full AI regeneration without warning. Users may not realize they are about to wait 10-30 seconds for a new report.

**Changes in `AudienceToggle.tsx`:**
- Import `AlertDialog` components from radix
- When user clicks a different audience, show a confirmation dialog: "Switching views will regenerate the report using AI. This may take 15-30 seconds."
- Only call `onChange` if the user confirms
- If clicking the already-active audience, do nothing (no dialog needed)

## Fix 10: Responsive Padding and Accent Bar Thickness

`StoryChapter` uses fixed `px-8` padding that crowds content on tablets. The accent bar at top is only 1px (`h-1`) which is barely visible.

**Changes in `StoryChapter.tsx`:**
- Change `px-8` to `px-5 sm:px-8` on `CardHeader` (line 91) and `CardContent` (line 129)
- Change `pt-8` to `pt-6 sm:pt-8` on `CardHeader`
- Change accent bar from `h-1` to `h-1.5` (line 87) for better visibility

---

## Summary of All Files Touched

| File | Changes |
|------|---------|
| `NarrativeReportViewer.tsx` | Remove StoryProgressBar, footer "X of Y", header motion.div |
| `StoryChapter.tsx` | Remove all internal motion.divs, responsive padding, thicker accent bar |
| `StoryJourneyNav.tsx` | Remove active chapter info block, single-play pulse |
| `InsightCard.tsx` | Restructure layout to lead with agreement % |
| `QuoteCarousel.tsx` | Remove per-quote Anonymous, fix sub-12px text, add global disclaimer |
| `AudienceToggle.tsx` | Add AlertDialog confirmation before regeneration |

No database or backend changes required.

