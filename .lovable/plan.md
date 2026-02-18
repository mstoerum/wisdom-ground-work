

# Apple-Inspired Progress Indicator for Spradley

Remove the Resonance Rings SVG overlay and replace it with a minimal, refined progress element that follows Apple's design principles: clarity, deference, and depth. The progress indicator should serve the content, never compete with it.

---

## Design Philosophy

Apple's approach to progress is about **confidence without noise**. Think of the Activity Rings on Apple Watch -- simple, glanceable, satisfying. Or the iOS download progress circle -- you know where you are without thinking about it. The indicator should feel like it belongs to the OS, not to a feature.

**Core principles applied:**

- **Deference**: The chat is the hero. Progress lives in the periphery of attention.
- **Clarity**: One glance tells you "I'm making progress" without requiring interpretation.
- **Depth**: Subtle physicality -- light, shadow, blur -- gives it weight without bulk.
- **Reward**: Completion of each segment feels like a gentle "click" into place (haptic metaphor through animation).

---

## The Design: "Ambient Arc"

A thin, elegant arc sits at the very top of the interview area (or just below the header). It is inspired by the Apple Watch activity ring but linearized into a gentle curve.

**Visual description:**

- A single, thin (3px) track line spans the top of the content area -- slightly curved like a gentle smile, or perfectly horizontal
- As themes are covered, segments of the arc fill in with a smooth, spring-based animation
- Each segment corresponds to a theme but is **not labeled** -- the arc simply fills
- The fill color uses a subtle gradient that shifts warmer as coverage increases (from the existing sage to terracotta palette)
- When a segment completes, a tiny light bloom travels along the arc to the new position (like the iOS charging animation)
- The unfilled portion is a barely-visible track (5% opacity foreground color)

**What makes it Apple:**

- **No text, no numbers** on the indicator itself
- **Spring physics** on the fill animation (slight overshoot, then settle)
- **Backdrop blur** on the track gives it a frosted-glass feel against the content behind it
- **SF-style proportions**: thin, precise, with generous whitespace around it

---

## What Changes

### 1. Remove `ResonanceRings` from `FocusedInterviewInterface.tsx`

- Remove the `ResonanceRings` import and the `<ResonanceRings>` component from the active interview area
- Remove the `lastAnswerLength` state variable (no longer needed)
- Keep the `themeProgress` data -- the new indicator uses it

### 2. Create new component: `src/components/employee/AmbientArc.tsx`

A lightweight component that renders a thin progress arc.

**Props:**
- `themeProgress`: The existing `ThemeProgress` type (themes array with discussed/current status, coveragePercent)
- `questionNumber`: Current question count (used as fallback if no theme data)

**Rendering:**
- A single SVG element, 100% width, ~20px tall
- Background track: thin line (3px) with 5% opacity foreground color
- Progress fill: animated line segment whose width maps to `coveragePercent`
- Fill uses a CSS linear gradient transitioning through the palette as coverage grows
- Animation: Framer Motion `spring` transition (stiffness: 300, damping: 30) for the fill width
- On each segment completion: a brief luminance pulse (opacity 0.6 to 0.2 over 400ms) at the leading edge

**Segment logic:**
- The arc is divided into equal segments matching the number of themes
- Each discussed theme fills its segment with a satisfying spring animation
- The "current" theme segment shows a subtle pulse (breathing opacity)
- Segments fill left-to-right in theme order

### 3. Place `AmbientArc` in the layout

Position it directly below the header bar, above the question area:

```
+--[Header: Finish Early button]--+
|  ═══════════○─────────────────  |  <-- AmbientArc (thin, elegant)
|                                 |
|        AI Question              |
|        Answer Input             |
|                                 |
+--[Footer: Enter hint]----------+
```

The arc sits in its own `div` with `px-6` horizontal padding to align with content, and minimal vertical space (`py-2`).

### 4. Animation details

- **Fill advance**: `spring` with slight overshoot when a new theme segment fills
- **Leading edge glow**: A small radial gradient "bead" at the progress tip that pulses gently
- **Completion**: When all segments fill, the entire arc does a single warm pulse (opacity flash), then settles to a calm full state
- **Current theme breathing**: The segment being actively explored has a gentle opacity oscillation (0.6 to 0.9, 2s duration, infinite)

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/employee/AmbientArc.tsx` | **Create** -- new minimal progress arc component |
| `src/components/employee/FocusedInterviewInterface.tsx` | **Modify** -- remove ResonanceRings, add AmbientArc below header |

---

## Accessibility

- The SVG arc is `aria-hidden="true"` (decorative)
- An `aria-live="polite"` visually-hidden span announces: "{discussed} of {total} topics explored" when theme coverage changes
- No information is conveyed solely through the visual

## Mobile

- The arc scales to full width on any screen size
- The 3px thickness and minimal height (~20px total with padding) means zero layout impact
- Touch targets are not needed -- the arc is non-interactive

