

# Theme Deep-Dive: Full-Width Detail View with Smooth Transitions

## What Changes

The theme landscape grid keeps its clean, scannable card layout. But instead of flipping cards in place, clicking a card smoothly expands into a full-width detail view right where the grid was -- no page navigation, no route change. A "Back to landscape" button brings you back with the reverse animation.

The detail view is dedicated to **root causes and recommendations**, with supporting strengths/frictions and employee quotes as evidence.

## How the Transition Works

The transition uses framer-motion's `layoutId` prop -- the same technique Apple uses in their App Store card animations. Here's the flow:

1. You click a theme card (e.g. "Work-Life Balance, score 62")
2. The card's background, score, and title **morph** into the detail view's header -- same element, new size/position
3. The rest of the grid fades out while the detail content fades in below the header
4. Clicking "Back to landscape" reverses: the header shrinks back into the card, grid fades back in

This creates a feeling of continuity -- the card *becomes* the detail view rather than navigating away.

## Detail View Layout

The full-width detail view is structured in clear sections, prioritizing root causes:

```text
+--------------------------------------------------------------+
| < Back to Theme Landscape                                     |
+--------------------------------------------------------------+
| WORK-LIFE BALANCE                    62 / Growing  [orb]      |
| 24 voices  |  Medium confidence  |  Mixed opinions            |
+--------------------------------------------------------------+
|                                                                |
|  ROOT CAUSES & RECOMMENDATIONS                                |
|  +---------------------------+  +---------------------------+  |
|  | [HIGH] Meeting overload   |  | [MED] Unclear priorities  |  |
|  | reduces focus time        |  | across teams              |  |
|  | Affects 15 respondents    |  | Affects 9 respondents     |  |
|  | -> Block 2hr daily focus  |  | -> Weekly priority sync   |  |
|  +---------------------------+  +---------------------------+  |
|                                                                |
|  +-----------------------------+-----------------------------+ |
|  | WHAT'S WORKING              | WHAT NEEDS ATTENTION        | |
|  | "Remote work flexibility.." | "Too many back-to-back.."   | |
|  |  12 voices, High confidence |  8 voices, Moderate conf.   | |
|  | "Team support is great..."  | "Hard to disconnect..."     | |
|  |  9 voices, High confidence  |  6 voices, Moderate conf.   | |
|  +-----------------------------+-----------------------------+ |
|                                                                |
|  SUPPORTING QUOTES (3 most relevant)                          |
|  "I love my team but spend 4-5hrs daily in meetings..."       |
|  "The flexibility to work from home has been transformative.." |
|  "Would be great if leadership shared priorities more..."     |
+--------------------------------------------------------------+
```

## Files to Create / Modify

### New file: `src/components/hr/analytics/ThemeDetailView.tsx`
The full-width detail view component. Receives the selected theme + enriched data and renders:
- Header with score, status, confidence, polarization badge
- Root causes grid using existing `RootCauseCard` components
- Two-column strengths/frictions using existing `ThemeInsightCard` components
- Supporting quotes section (top 3-5 from theme data)
- "Back to landscape" button

### Modify: `src/components/hr/analytics/ThemeGrid.tsx`
- Add state for `selectedThemeId`
- Wrap grid + detail view in `AnimatePresence`
- When a theme is selected: hide the grid (fade out), show `ThemeDetailView` (fade in)
- When deselected: reverse

### Modify: `src/components/hr/analytics/ThemeCard.tsx`
- Remove the 3D flip logic entirely (no more `isFlipped`, `rotateY`, back face)
- Keep only the front face (score, name, orb)
- Add `layoutId={theme.id}` to enable shared element transition
- Add `onClick` callback prop instead of internal flip state
- Add a subtle hover effect (slight scale + shadow lift) to indicate clickability

### Modify: `src/components/hr/analytics/HybridInsightsView.tsx`
- Pass the `onThemeSelect` / `selectedTheme` state down to `ThemeGrid`
- No structural changes needed -- ThemeGrid handles the view swap internally

## Transition Implementation Details

```text
ThemeGrid (manages state)
  |
  +-- selectedTheme === null --> Show grid of ThemeCards
  |     Each card has layoutId={theme.id}
  |     Cards fade in with staggered delay
  |
  +-- selectedTheme !== null --> Show ThemeDetailView
        Header shares layoutId={theme.id}
        Content enters with fade + slide-up
        "Back" button sets selectedTheme = null
```

Key framer-motion techniques:
- `layoutId` on the card surface and detail header for morphing
- `AnimatePresence mode="wait"` to sequence exit before enter
- Exit animation: grid cards fade out (opacity 0, slight scale down)
- Enter animation: detail content fades in from below (opacity 0 -> 1, y: 20 -> 0)
- Spring physics: stiffness ~300, damping ~30 for snappy but smooth feel
- Escape key closes detail view (keyboard accessibility)

## What Gets Reused

These existing components are already built and will be composed into the detail view:
- `RootCauseCard` -- renders cause, impact level, affected count, recommendation
- `ThemeInsightCard` -- renders semantic insights with voice count and confidence
- `PolarizationBadge` -- shows "Mixed" or "Divided" opinion indicator
- `ConfidenceIndicator` -- shows data reliability level
- `getHealthConfig()` -- reused from ThemeCard for consistent color theming

## No Database or Backend Changes

All data already exists in `ThemeAnalyticsData` (root causes, insights, polarization, health scores). This is purely a frontend presentation change.

