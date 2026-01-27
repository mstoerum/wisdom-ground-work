
# Analytics Page Redesign: Themes & Story as Distinct Experiences

## Collaborative Design Review

**Darrell Estabrook** (Enterprise Dashboard Specialist):
> "Splitting into separate pages is exactly right. The current page tries to serve two masters - quick health scanning AND deep narrative reading. These are fundamentally different cognitive modes. Give each room to breathe."

**Can Yelok** (Data Visualization Expert):
> "Love the rounded rectangle concept! Current horizontal bars are too 'spreadsheet-y'. Rounded cards are more approachable and create natural tap targets. Think of them as 'theme tiles' - each one a complete story waiting to be opened."

**Volodymyr Deviatkin** (Interaction Designer):
> "The progressive disclosure pattern is perfect for this. Show just enough to spark curiosity: theme name, a single headline metric, and a clear status indicator. The reveal should feel like opening a drawer, not a jarring page jump."

---

## Architecture Change: Two Distinct Pages

### Current Structure
```text
/hr/analytics (single page with everything)
    ├── Survey Selector
    ├── Refresh Bar
    ├── Tabs (Insights | Compare)
    │   └── HybridInsightsView
    │       ├── DataConfidenceBanner
    │       ├── PulseSummary
    │       ├── QuickInsightBadges
    │       ├── ActionSummaryCard
    │       ├── ThemeTerrain
    │       └── NarrativeReportViewer
```

### New Structure
```text
/hr/analytics (landing - Theme Health focus)
    ├── Shared: Survey Selector + Refresh Bar
    ├── PulseSummary (compact metrics row)
    └── NEW: ThemeCards (rounded rectangle grid)

/hr/analytics/story (dedicated - Narrative focus)
    ├── Shared: Survey Selector + Refresh Bar
    ├── ActionSummaryCard (if relevant)
    └── NarrativeReportViewer (full width, immersive)
```

---

## New Component: ThemeCard

Replace horizontal bars with rounded, expandable rectangles.

### Collapsed State (Initial View)
```text
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   🟢  Work-Life Balance                                │
│                                                         │
│   THI  78     ○○○○○○○●●●  12 voices     Thriving       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**What's shown:**
- Status indicator (colored dot: emerald/amber/rose)
- Theme name (prominent)
- Theme Health Index (THI) number
- Minimal progress arc or bar
- Voice count
- Status label (Thriving/Stable/Friction/Critical)

### Expanded State (Click to Reveal)
```text
┌─────────────────────────────────────────────────────────┐
│   🟢  Work-Life Balance                     [Collapse]  │
├─────────────────────────────────────────────────────────┤
│   THI  78     ○○○○○○○●●●  12 voices     Thriving       │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Strengths                                             │
│   ┌───────────────────────────────────────────────────┐ │
│   │ "Flexible scheduling appreciated by most team     │ │
│   │  members" — 8 voices, High confidence             │ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
│   Frictions                                             │
│   ┌───────────────────────────────────────────────────┐ │
│   │ "After-hours messages create pressure" — 4 voices │ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
│   Root Cause                                            │
│   ┌───────────────────────────────────────────────────┐ │
│   │ Unclear boundaries around async communication     │ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**What's revealed:**
- Full AI-analyzed insights (Strengths, Frictions)
- Root cause analysis
- Supporting quotes with voice counts
- Smooth animation drawer effect

---

## Visual Design Specifications

### ThemeCard Styling
- **Border radius**: `rounded-2xl` (16px) for soft, approachable feel
- **Background**: Subtle gradient based on health status
  - Thriving: `bg-gradient-to-br from-emerald-50 to-white`
  - Stable: `bg-gradient-to-br from-teal-50 to-white`
  - Friction: `bg-gradient-to-br from-amber-50 to-white`
  - Critical: `bg-gradient-to-br from-rose-50 to-white`
- **Shadow**: `shadow-sm hover:shadow-md` for subtle depth
- **Status dot**: 12px colored circle with pulse animation for Critical

### Grid Layout
- **Desktop**: 2-column grid with `gap-4`
- **Mobile**: Single column, full width cards
- When expanded, card spans full width on desktop too

### Animation Specifications
- **Expand**: 300ms ease-out, height grows from content
- **Collapse**: 250ms ease-in
- **Hover**: Scale up 1.01 + shadow increase
- **Status dot pulse**: For Critical themes only

---

## Navigation Between Pages

### Option A: Tabs (Simpler)
Keep tabs but in HRLayout sidebar:
- Analytics (Themes)
- Analytics (Story)

### Option B: In-Page Link (Better UX)
At bottom of Themes page:
```text
┌─────────────────────────────────────────────────────────┐
│  📖 Ready for the full story?                          │
│                                                         │
│  [View Story Report →]                                  │
└─────────────────────────────────────────────────────────┘
```

At top of Story page:
```text
[← Back to Themes]  Survey: Q1 Engagement  [Refresh]
```

---

## Files to Create/Modify

### Create New Files
| File | Purpose |
|------|---------|
| `src/pages/hr/AnalyticsStory.tsx` | New page for Story Report |
| `src/components/hr/analytics/ThemeCard.tsx` | New rounded rectangle component |
| `src/components/hr/analytics/ThemeGrid.tsx` | Grid layout for theme cards |

### Modify Existing Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/hr/analytics/story` |
| `src/components/hr/HRLayout.tsx` | Update sidebar (optionally split Analytics) |
| `src/pages/hr/Analytics.tsx` | Simplify to Theme-focused view |
| `src/components/hr/analytics/HybridInsightsView.tsx` | Remove or refactor |

### Remove/Deprecate
| File | Reason |
|------|--------|
| `ThemeTerrain.tsx` | Replaced by ThemeCard/ThemeGrid |
| `QuickInsightBadges.tsx` | Redundant with new card design |

---

## Implementation Phases

### Phase 1: ThemeCard Component
1. Create `ThemeCard.tsx` with collapsed/expanded states
2. Add smooth expand/collapse animation
3. Style with rounded corners and gradient backgrounds
4. Support both basic and AI-enriched data

### Phase 2: Theme Grid Layout
1. Create `ThemeGrid.tsx` as container
2. Implement 2-column responsive grid
3. Add accordion behavior (one expanded at a time)
4. Sorting by health status

### Phase 3: Analytics Page Refactor
1. Simplify `Analytics.tsx` to show PulseSummary + ThemeGrid
2. Add "View Story Report" navigation link
3. Remove unused components

### Phase 4: Story Report Page
1. Create `AnalyticsStory.tsx` as dedicated page
2. Give NarrativeReportViewer full width
3. Add back navigation to Themes
4. Add route in App.tsx

### Phase 5: Navigation Polish
1. Update HRLayout sidebar
2. Add breadcrumb/back links
3. Persist selected survey between pages (URL params)

---

## Designer Collaboration Notes

**Darrell**: "Make sure the survey selector is sticky at the top of both pages. Users should never lose context of which survey they're viewing."

**Can**: "For the status dot, use CSS animations not JS. Keep it lightweight. The pulse should be subtle - 1.2x scale, 1.5s infinite."

**Volodymyr**: "Test the expand animation on mobile carefully. The content shift should feel natural, not jumpy. Consider adding a subtle background dim for other cards when one is expanded."

---

## Technical Considerations

### URL Structure for Survey Context
```text
/hr/analytics?survey=abc123
/hr/analytics/story?survey=abc123
```
Persist survey selection in URL params to maintain context when navigating.

### Shared State
Both pages need:
- Survey selection
- Refresh functionality
- Real-time subscriptions

Extract shared logic into a custom hook `useAnalyticsContext` or pass via URL params.

---

## Summary

This redesign creates two focused experiences:
1. **Themes Page**: Quick health scanning with beautiful, tappable cards
2. **Story Page**: Immersive narrative reading without distractions

The rounded rectangle cards transform themes from data rows into approachable, explorable tiles that invite interaction.
