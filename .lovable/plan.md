

# Build "Resonance Rings" Progress Visualization

Replace the side-panel journey map with an ambient concentric ripple visualization that grows organically as the user answers questions. No numbers, no fixed endpoints -- just expanding rings of impact.

## Visual Design

Each answer creates a ripple that expands outward and settles as a persistent ring behind the question area. The rings communicate progress through density and warmth rather than numbers.

- **Ring radius**: Proportional to cumulative progress (inner = early, outer = later)
- **Ring thickness**: Driven by response quality (word count as a proxy -- longer, more thoughtful answers produce thicker rings)
- **Ring color**: Maps to sentiment/theme -- uses existing palette (terracotta for passionate, sage for reflective, butter-yellow for positive, coral for neutral)
- **Ring opacity**: 15-25% so it's ambient, not distracting
- **Animation**: Each new ring ripples outward with a 600ms ease-out, then settles with a brief glow pulse as a micro-reward
- **Theme transitions**: Subtle shift in ring style (solid vs slightly dashed) when a new theme begins

## What Changes

### 1. New component: `src/components/employee/ResonanceRings.tsx`

A self-contained SVG component that receives the current ring data and renders the concentric visualization.

**Props:**
- `rings`: Array of ring data (one per answered question), each with radius, thickness, color, and animation state
- `questionNumber`: Current question count (drives ring count)
- `themeProgress`: Optional theme data to influence ring colors
- `latestRingTrigger`: A counter that increments on each new answer, triggering the ripple animation for the newest ring

**Rendering approach:**
- SVG viewBox centered on origin (0,0), rendered at full width of the question area
- Each ring is an SVG circle with Framer Motion entry animation
- The newest ring gets an extra "ripple" animation (expanding + fading ghost circle)
- A very subtle radial gradient in the center provides warmth
- Rings use the existing CSS custom properties for colors (terracotta, sage, coral, butter-yellow)

### 2. Modify: `src/components/employee/FocusedInterviewInterface.tsx`

**Remove:**
- The 240px side panel (`<motion.aside>` block, lines 430-444) containing `ThemeJourneyPath`
- The mobile "Topic X of Y" text counter (lines 405-408)
- The import of `ThemeJourneyPath` (line 6)

**Add:**
- Import `ResonanceRings`
- Place `<ResonanceRings>` as an absolute-positioned background layer behind the question/answer area (inside the `isActive` main content div)
- Pass `questionNumber`, `themeProgress`, and a trigger value that increments after each successful `handleSubmit`
- The main content area becomes full-width (no longer sharing space with a side panel)

### 3. Ring data generation logic

Built into the `ResonanceRings` component:
- Each question answered adds a ring to an internal array
- Ring properties are calculated from:
  - **Radius**: `baseRadius + (index * radiusStep)` -- rings grow outward
  - **Thickness**: `clamp(2, wordCount / 15, 8)` -- longer answers = thicker rings
  - **Color**: Cycles through theme-mapped colors from the palette, or uses the current theme's color from `themeProgress`
- The component maintains its own ring state array, appending when `questionNumber` changes

### 4. Micro-reward animation

When a new ring appears:
1. A ghost circle starts at the center and expands to the ring's final radius (400ms, ease-out)
2. The actual ring fades in at its position with a brief glow (opacity pulse from 0.4 to 0.2 over 800ms)
3. A subtle warmth shift: the center radial gradient becomes slightly warmer with each ring

## Layout Change

```text
BEFORE:
+--[Side Panel 240px]--+--[Question Area]--+
|  ThemeJourneyPath     |  AI Question      |
|  (vertical list)      |  Answer Input     |
+-----------------------+-------------------+

AFTER:
+----------[Full Width Question Area]----------+
|  +--(Resonance Rings, absolute, behind)--+   |
|  |  ○  ○  ○  (concentric rings)          |   |
|  |       AI Question                     |   |
|  |       Answer Input                    |   |
|  +---------------------------------------+   |
+----------------------------------------------+
```

## Files Summary

| File | Action |
|------|--------|
| `src/components/employee/ResonanceRings.tsx` | **Create** -- new SVG ring visualization component |
| `src/components/employee/FocusedInterviewInterface.tsx` | **Modify** -- remove side panel, add ResonanceRings as background layer |

## Accessibility

- All rings are decorative (`aria-hidden="true"` on the SVG)
- An `aria-live="polite"` region with screen-reader-only text: "Question {n} answered" updates after each submission
- No information is conveyed solely through the visual -- the existing text-based hints remain

## Mobile Behavior

- Rings render at a smaller scale (max 200px diameter) on mobile via responsive sizing
- The removal of the side panel means mobile gets full-width content (improvement over current layout where the panel was hidden anyway)

