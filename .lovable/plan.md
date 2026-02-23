

# Implement HoverButton with Trailing Circle Effect for Interview Continue Button

## What Changes

Replace the standard Continue button in the interview's text input with a playful HoverButton that spawns gradient circles trailing the cursor on hover -- adding a tactile, delightful interaction that rewards engagement.

## New File: `src/components/ui/hover-button.tsx`

Create the HoverButton component based on the provided code, adapted to work with the project's design system:

- Uses CSS custom properties `--circle-start` and `--circle-end` for the gradient, mapped to the terracotta palette (`hsl(var(--terracotta-primary))` and `hsl(var(--coral-accent))`)
- Circles spawn every 100ms on pointer move, fade in over ~200ms, then fade out and are removed after ~2.2s
- The component wraps children and layers circles behind the text content using `overflow: hidden` and `position: relative`
- Accepts all standard button HTML attributes plus `className` for composition
- Proper TypeScript types and forwardRef pattern

## Modified File: `src/components/employee/AnswerInput.tsx`

- Import `HoverButton` instead of (or alongside) `Button`
- Replace the Continue button (line 138-155) with `HoverButton`
- Keep the same `onClick`, `disabled`, sizing, and content (Continue + ArrowRight icon, or Loading state)
- Apply the terracotta background and rounded-full styling to HoverButton
- When disabled, the hover effect is naturally suppressed (pointer-events-none from the disabled styles)

## Visual Result

The Continue button looks the same at rest, but on hover, soft terracotta-to-coral gradient circles bloom and trail behind the cursor inside the button boundary -- a subtle reward for interacting. This adds the kind of micro-delight that reduces perceived effort during the interview.

## Technical Details

| File | Action |
|------|--------|
| `src/components/ui/hover-button.tsx` | Create -- HoverButton component with circle-trail hover effect |
| `src/components/employee/AnswerInput.tsx` | Modify -- Replace `Button` with `HoverButton` for the Continue button only |

The implementation uses only React state and CSS (no extra dependencies). Circle cleanup is handled via `setTimeout` chains to manage fade-in, fade-out, and removal phases.

