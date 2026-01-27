

# Story Report Redesign: Immersive Tab Experience

## Design Refinement

Removed the "word cloud" suggestion from Chapter 1 (The Voices) - we'll use the more modern quote gallery with variable sizing based on agreement percentage instead.

---

## Architecture: 3-Tab Analytics Layout

### New Tab Structure

```text
Analytics Page
├── Tabs: [Overview] [Story Report] [Compare]
│
├── Overview Tab
│   ├── Pulse Summary (metrics)
│   └── Theme Grid (flip cards with full space)
│
├── Story Report Tab ← NEW DEDICATED TAB
│   ├── Story Header with metrics
│   ├── Visual Journey Navigation
│   └── Full-viewport chapter content
│
└── Compare Tab
    └── Survey Comparison (unchanged)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/hr/analytics/StoryJourneyNav.tsx` | Visual chapter navigation with icons |
| `src/components/hr/analytics/StoryProgressBar.tsx` | Reading progress with time estimate |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/hr/Analytics.tsx` | Restructure to 3 tabs: Overview, Story Report, Compare |
| `src/components/hr/analytics/HybridInsightsView.tsx` | Remove embedded NarrativeReportViewer |
| `src/components/hr/analytics/NarrativeReportViewer.tsx` | Upgrade to immersive full-page layout |

---

## Implementation Phases

### Phase 1: Tab Restructure
1. Update Analytics.tsx with 3 tabs
2. Rename "Insights" to "Overview"
3. Add "Story Report" as middle tab
4. Move story report generation/viewing to dedicated tab

### Phase 2: Story Journey Navigation
1. Create StoryJourneyNav with visual chapter icons:
   - 👥 Voices → 🏔️ Landscape → ⚠️ Frictions → 🔍 Root Causes → 🎯 Forward → 🤝 Commitment
2. Active state with connecting progress line
3. Chapter title and "X of Y" indicator

### Phase 3: Enhanced Reading Experience
1. Full-viewport chapter content area
2. Directional slide transitions (left/right based on navigation direction)
3. Reading progress bar with time estimate
4. Prev/Next navigation footer

### Phase 4: HybridInsightsView Cleanup
1. Remove NarrativeReportViewer from Overview tab
2. Keep only Pulse Summary + Theme Grid
3. Add "View Full Story Report" link to Story Report tab

---

## Visual Journey Navigation Design

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   👥──────🏔️──────⚠️──────🔍──────🎯──────🤝                        │
│   ●       ○       ○       ○       ○       ○                        │
│                                                                     │
│   The Voices                                           1 of 6      │
│   Who spoke and what they shared                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Animation Specifications

### Chapter Transitions (Framer Motion)
```text
Direction-aware slide:
- Next chapter: slide in from right
- Previous chapter: slide in from left
- Spring physics: stiffness 300, damping 30
```

### Journey Progress
- Connecting line animates as chapters are visited
- Active icon scales up with subtle bounce
- Completed chapters show filled dots

---

## Expected Outcome

1. **Theme Grid gets full space** in Overview tab
2. **Story Report is elevated** to dedicated immersive experience
3. **Visual navigation** creates sense of journey through insights
4. **Modern, clean design** without dated techniques like word clouds

