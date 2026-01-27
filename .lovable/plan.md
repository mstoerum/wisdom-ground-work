
# ThemeCard Implementation: Full-Width Expansion (Option A)

## Design Team Final Consensus

**Darrell Estabrook**: "Full-width is the pragmatic choice. It gives content room without CSS Grid complexity. The key is making the expansion feel luxurious, not utilitarian."

**Can Yelok**: "We need to nail the visual differentiation between collapsed and expanded states. Collapsed = scannable data card. Expanded = immersive insight panel."

**Volodymyr Deviatkin**: "The animation choreography is everything. Height transition, shadow elevation, content stagger - these micro-moments build trust."

---

## Component Architecture

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/hr/analytics/ThemeCard.tsx` | Individual theme tile with collapsed/expanded states |
| `src/components/hr/analytics/ThemeGrid.tsx` | Grid container with accordion behavior |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/hr/analytics/HybridInsightsView.tsx` | Replace ThemeTerrain with ThemeGrid |

### Files to Remove (after verification)

| File | Reason |
|------|--------|
| `src/components/hr/analytics/ThemeTerrain.tsx` | Replaced by ThemeCard/ThemeGrid |
| `src/components/hr/analytics/QuickInsightBadges.tsx` | Redundant - inline quote in cards serves this purpose |

---

## ThemeCard Component Design

### Collapsed State Layout

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ●  Work-Life Balance                                    ▼     │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ THI                                                    │   │
│  │  78   ━━━━━━━━━━━━━━━━━━●━━━━━━   12 voices  Thriving │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  "Flexible scheduling appreciated by most team members"        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Visual Elements:**
- **Status Orb**: 12px colored circle (emerald/teal/amber/orange/rose)
- **Theme Name**: 16px font-semibold, prominent
- **Chevron**: Rotates 180° on expand
- **Health Bar**: Horizontal progress with animated fill
- **THI Score**: Bold number with status label
- **Voice Count**: Badge-style count
- **Representative Quote**: First positive quote for healthy themes, first concern for friction themes

### Expanded State Layout

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ●  Work-Life Balance                                    ▲     │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ THI                                                    │   │
│  │  78   ━━━━━━━━━━━━━━━━━━●━━━━━━   12 voices  Thriving │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  STRENGTHS                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ "Flexible scheduling appreciated by most team members"   │ │
│  │ 8 voices  •  High confidence                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ "Remote work options valued highly"                      │ │
│  │ 6 voices  •  Moderate                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  FRICTIONS                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ "After-hours messages create pressure"                   │ │
│  │ 4 voices  •  High confidence                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ROOT CAUSE                                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ⚠ Unclear boundaries around async communication          │ │
│  │   HIGH IMPACT  •  Affects 4 respondents                  │ │
│  │                                                          │ │
│  │   → Recommendation: Establish team communication norms   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Visual Design Specifications

### Color System by Health Status

| Health | Status | Card Gradient | Border Accent | Orb Color |
|--------|--------|---------------|---------------|-----------|
| 80-100 | Thriving | `from-emerald-50/60 to-white` | `border-l-emerald-400` | `bg-emerald-500` |
| 60-79 | Growing | `from-teal-50/60 to-white` | `border-l-teal-400` | `bg-teal-500` |
| 45-59 | Emerging | `from-amber-50/60 to-white` | `border-l-amber-400` | `bg-amber-500` |
| 30-44 | Challenged | `from-orange-50/60 to-white` | `border-l-orange-400` | `bg-orange-500` |
| 0-29 | Critical | `from-rose-50/60 to-white` | `border-l-rose-400` | `bg-rose-500` + pulse |

### Card Styling

```text
Collapsed:
- rounded-2xl (16px border radius)
- border-l-4 (status color accent)
- shadow-sm → hover:shadow-md
- bg-gradient-to-br (status gradient)
- p-5 padding

Expanded:
- Same base styling
- shadow-lg (elevated)
- Divider line before content sections
```

---

## Animation Specifications

### Interaction Timeline

| Phase | Animation | Duration | Easing |
|-------|-----------|----------|--------|
| Grid entrance | Cards stagger fade-in | 400ms each, 50ms delay | ease-out |
| Card hover | Scale 1.01, shadow increase | 150ms | ease-out |
| Chevron rotation | Rotate 180° | 200ms | ease-in-out |
| Card expand | Height grows smoothly | 300ms | spring (stiffness: 300, damping: 30) |
| Card collapse | Height shrinks | 250ms | ease-in-out |
| Content stagger | Strengths → Frictions → Root Cause | 100ms delay between sections | ease-out |
| Health bar fill | Width animates 0 to value | 600ms | ease-out, 200ms delay |
| Critical orb pulse | Scale 1.15 pulse | 2s infinite | ease-in-out |

### Framer Motion Configuration

```text
Card Expand Spring:
- type: "spring"
- stiffness: 300
- damping: 30

Content Stagger:
- staggerChildren: 0.1
- initial: { opacity: 0, y: 8 }
- animate: { opacity: 1, y: 0 }
```

---

## ThemeGrid Layout

### Desktop (≥768px)
- 2-column grid with `gap-4`
- When card expands, it takes full width
- Other cards shift down naturally

### Mobile (<768px)
- Single column, full width
- Same expand behavior
- Touch-friendly tap targets

### Accordion Behavior
- Only one card expanded at a time
- Clicking a new card auto-closes the previous
- Click on expanded card header to collapse

---

## Data Flow

### Props Interface

```text
ThemeCardProps {
  theme: ThemeInsight
  enrichedData?: ThemeAnalyticsData
  isExpanded: boolean
  onToggle: () => void
  index: number  // For stagger animation
}

ThemeGridProps {
  themes: ThemeInsight[]
  enrichedThemes?: ThemeAnalyticsData[]
  isLoading?: boolean
}
```

### Data Mapping

**Collapsed State:**
- Theme name: `theme.name`
- Health score: `enrichedData?.healthIndex ?? theme.avgSentiment`
- Status: Derived from health score
- Voice count: `theme.responseCount`
- Representative quote: First from `enrichedData?.insights.strengths[0]` or `theme.keySignals.positives[0]` (or concerns if friction)

**Expanded State:**
- Strengths: `enrichedData?.insights.strengths` or `theme.keySignals.positives`
- Frictions: `enrichedData?.insights.frictions` or `theme.keySignals.concerns`
- Root Causes: `enrichedData?.rootCauses`

---

## Implementation Phases

### Phase 1: ThemeCard Collapsed State
1. Create ThemeCard.tsx component
2. Implement gradient backgrounds based on health
3. Add status orb with pulse animation for critical
4. Build health bar with animated fill
5. Add representative quote logic
6. Implement hover effects (scale, shadow)

### Phase 2: ThemeCard Expanded State
1. Add expand/collapse animation with framer-motion
2. Implement rotating chevron
3. Build Strengths section (reuse ThemeInsightCard)
4. Build Frictions section
5. Build Root Cause section (reuse RootCauseCard)
6. Add staggered content entrance animation

### Phase 3: ThemeGrid Container
1. Create ThemeGrid.tsx with responsive grid
2. Implement accordion state management
3. Add entrance stagger animation
4. Handle sorting by health (lowest first)
5. Test full-width expansion layout shift

### Phase 4: Integration
1. Update HybridInsightsView to use ThemeGrid
2. Remove ThemeTerrain import and usage
3. Remove QuickInsightBadges import and usage
4. Test with real survey data
5. Verify AI-enriched data displays correctly

### Phase 5: Polish & Accessibility
1. Add keyboard navigation (Tab, Enter, Escape)
2. Add ARIA labels for screen readers
3. Implement `prefers-reduced-motion` check
4. Test dark mode gradients
5. Mobile touch testing

---

## Reusing Existing Components

The expanded state will reuse:
- `ThemeInsightCard` for Strengths and Frictions sections
- `RootCauseCard` for Root Cause display

This ensures visual consistency and reduces code duplication.

---

## Expected Outcome

A theme overview that HR professionals can:
1. **Scan in 3 seconds** - Color-coded gradients and orbs show health at a glance
2. **Read representative quotes** - Inline quotes provide human context without clicks
3. **Explore deeply** - Smooth expansion reveals AI insights, evidence, and recommendations
4. **Feel delighted** - Spring animations and subtle shadows create a polished, trustworthy experience

The full-width expansion gives content maximum breathing room while maintaining the simple, elegant grid rhythm that Option A is known for.
