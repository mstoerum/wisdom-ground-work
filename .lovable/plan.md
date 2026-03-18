

## Problem

"I'm all good" appears as just another chip in the word cloud, identical in style to the topic options. Users can easily miss it because nothing visually distinguishes it as the "finish" action.

## Proposal

Visually separate "I'm all good" from the topic chips by rendering it below them as a distinct, secondary action — similar to a "skip" or "done" link. This makes the two actions clear: **pick a topic to explore** (chips) vs **finish the interview** (separate element).

### Changes to `WordCloudSelector.tsx`

1. **Detect the completion option** — check if an option contains "all good" (case-insensitive) and pull it out of the chip grid
2. **Render topic chips** as they are now (the grid)
3. **Render "I'm all good" separately below** as a standalone text button with a subtle check icon, lighter/muted styling, and slightly delayed entrance animation — visually distinct but not competing with the topic chips
4. **Make it a direct-submit action** — clicking "I'm all good" immediately submits `[SELECTED: I'm all good]` without needing to also click "Continue", since it's a terminal choice

The layout becomes:

```text
┌─────────────────────────────────┐
│  [Topic A]  [Topic B]  [Topic C]│  ← chips (select to explore)
│         [Something else…]       │
│                                 │
│      ✓ I'm all good, thanks     │  ← separate, muted text button
└─────────────────────────────────┘
```

Styling for the "I'm all good" button:
- Text-only (no background), muted foreground color
- Small check-circle icon prefix
- Slightly smaller text than the chips
- Appears last with a longer entrance delay

No backend changes needed.

