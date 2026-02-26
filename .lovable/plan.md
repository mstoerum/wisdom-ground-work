

# Fix: Progress Bar Always Showing Full (Orange)

## Problem

The `Progress` component in `src/components/ui/progress.tsx` imports from `radix-ui` (the unified package), but the indicator always appears fully filled. The `translateX` transform that controls the fill amount isn't being applied correctly with this import.

## Root Cause

The component was rewritten to use `import { Progress as ProgressPrimitive } from 'radix-ui'` but the original `@radix-ui/react-progress` package (already installed) is what works with the `Root` / `Indicator` sub-components and their transform-based fill mechanism.

## Fix

In `src/components/ui/progress.tsx`, change line 5:

**From:** `import { Progress as ProgressPrimitive } from 'radix-ui';`

**To:** `import * as ProgressPrimitive from '@radix-ui/react-progress';`

This restores the correct Radix primitive that supports `Root` and `Indicator` sub-components with proper transform behavior. The `ProgressCircle` and `ProgressRadial` components are pure SVG and unaffected.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/progress.tsx` | Fix import to use `@radix-ui/react-progress` instead of `radix-ui` |

