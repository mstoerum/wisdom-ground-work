

# Top 5 Design Improvements from Notion Designer Review

## 1. Collapse Header to One Row

Currently the analytics page stacks three separate blocks vertically: title/subtitle, survey selector, and refresh bar. This wastes ~120px of vertical space before any data appears.

**Change:** Merge the title, survey selector, and live status into a single compact row. The refresh bar gets absorbed into the header as inline controls rather than a standalone banner.

```text
BEFORE (3 rows, ~120px):
  Row 1: "Analytics" + subtitle
  Row 2: [Survey selector dropdown]
  Row 3: [Updated 2m ago] [42 responses] [Live] [Auto-refresh: Off] [Refresh]

AFTER (1 row, ~48px):
  "Analytics"  [Survey selector v]  *Live  Updated 2m ago  [Refresh icon]
```

### Files changed:
- **`src/pages/hr/Analytics.tsx`**: Combine the header `<div>`, survey selector `<div>`, and `<AnalyticsRefreshBar>` into a single flex row. Remove the subtitle paragraph (it duplicates information shown in PulseSummary). The refresh button becomes an icon-only button inline with the title. Auto-refresh selector moves into a dropdown menu on the refresh button.
- **`src/components/hr/analytics/AnalyticsRefreshBar.tsx`**: Refactor into a compact inline component (`AnalyticsRefreshInline`) that renders just a live dot, relative timestamp, and refresh icon -- no wrapping border/background.

## 2. Merge Confidence Badge into PulseSummary

The `DataConfidenceBanner` currently sits as a separate full-width block above PulseSummary, pushing content down. Its information (response count + confidence level) duplicates what PulseSummary already shows.

**Change:** Remove the standalone `DataConfidenceBanner` from `HybridInsightsView`. Instead, add a 5th metric card to `PulseSummary` showing data confidence level (Low/Good/High) with the shield icon and color coding from the banner.

### Files changed:
- **`src/components/hr/analytics/HybridInsightsView.tsx`**: Remove the `<DataConfidenceBanner>` render. Pass `surveyId` to `PulseSummary` so it can compute confidence internally.
- **`src/components/hr/analytics/PulseSummary.tsx`**: Add a "Confidence" metric card that uses the same threshold logic from `DataConfidenceBanner` (Low 0-9, Good 10-49, High 50+). Uses shield icon and color coding. Change grid from `grid-cols-4` to `grid-cols-5` on desktop (stays `grid-cols-2` on mobile, wrapping naturally).

## 3. Enforce 12px Minimum Text Size

Several components use sub-12px text that fails accessibility. Specific offenders:

| Component | Current | Fix |
|-----------|---------|-----|
| PulseSummary subtext | `text-[9px]` | `text-xs` (12px) |
| PulseSummary description | `text-[10px]` | `text-xs` (12px) |
| ThemeGrid "AI-analyzed" | `text-[10px]` | `text-xs` (12px) |
| ThemeDetailView "Q" badge | `text-[10px]` | `text-xs` (12px) |

### Files changed:
- **`src/components/hr/analytics/PulseSummary.tsx`**: Replace `text-[9px]` and `text-[10px]` with `text-xs`.
- **`src/components/hr/analytics/ThemeGrid.tsx`**: Replace `text-[10px]` with `text-xs`.
- **`src/components/hr/analytics/ThemeDetailView.tsx`**: Replace `text-[10px]` on Q badge with `text-xs`.

## 4. Add Signal Preview to ThemeCards

Currently, theme cards show only name + score + status orb. They are "information-sparse" -- you have to click to learn anything useful. Adding a small signal line gives HR a reason to click.

**Change:** Add a single-line signal preview below the status orb showing voice count and a friction/strength hint when enriched data is available.

```text
BEFORE:                          AFTER:
+---------------------+         +---------------------+
|   Work-Life Balance |         |   Work-Life Balance |
|        62           |         |        62           |
|     Growing  *      |         |     Growing  *      |
|                     |         |  18 voices . 2 flags |
+---------------------+         +---------------------+
```

### Files changed:
- **`src/components/hr/analytics/ThemeCard.tsx`**: Add a new line below the status orb. Show `{responseCount} voices` and, if enriched data exists, a dot separator followed by the number of frictions flagged (e.g., "2 flags") or "All positive" if no frictions. Use `text-xs text-muted-foreground` styling. Reduce card height from `h-56` to `h-52` to keep it compact with the new line.

## 5. Remove Unnecessary Entry Animations

The review flagged "motion bloat" -- staggered fade-in animations on every card and section feel slow on repeat visits and add no information. Keep only interaction-triggered motion (the card-to-detail transition).

**Change:** Remove automatic `initial`/`animate` entry animations from:
- ThemeCard stagger (`delay: index * 0.05`)
- ThemeDetailView section staggers (`delay: 0.2`, `0.3`, `0.4`)
- PulseSummary metric card stagger (`delay: index * 0.08`)
- ThemeGrid section header fade

Keep:
- `layoutId` transitions (card morphing into detail -- this is interaction-triggered)
- `AnimatePresence` exit animations (grid/detail swap)
- The click-to-reveal quote expansion animation

### Files changed:
- **`src/components/hr/analytics/ThemeCard.tsx`**: Remove `initial`, `animate`, `exit`, and `transition` with delay from the outer `motion.div`. Keep only `layoutId` and the CSS `hover:` effects.
- **`src/components/hr/analytics/PulseSummary.tsx`**: Replace `motion.div` with plain `div` for each metric card (remove framer-motion import if no longer needed).
- **`src/components/hr/analytics/ThemeDetailView.tsx`**: Remove staggered `initial`/`animate` from section wrappers. Keep `AnimatePresence` on the quote expansion.
- **`src/components/hr/analytics/ThemeGrid.tsx`**: Remove the `motion.div` and `AnimatePresence` from the section header. Keep the grid/detail `AnimatePresence` swap.

---

## Summary of All Files Touched

| File | Changes |
|------|---------|
| `src/pages/hr/Analytics.tsx` | Collapse header to single row, inline refresh controls |
| `src/components/hr/analytics/AnalyticsRefreshBar.tsx` | Refactor to compact inline format |
| `src/components/hr/analytics/HybridInsightsView.tsx` | Remove DataConfidenceBanner, pass surveyId to PulseSummary |
| `src/components/hr/analytics/PulseSummary.tsx` | Add confidence metric, fix text sizes, remove entry animations |
| `src/components/hr/analytics/ThemeCard.tsx` | Add signal preview line, remove entry animations |
| `src/components/hr/analytics/ThemeGrid.tsx` | Fix text sizes, remove header animation |
| `src/components/hr/analytics/ThemeDetailView.tsx` | Fix text sizes, remove section stagger animations |

No database or backend changes required.
