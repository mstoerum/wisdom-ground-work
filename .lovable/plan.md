

# Analysis: Theme Mislabeling & Early Mood Exchanges

## Problem 1: Early exchanges always get force-tagged to a theme

The `extract-signals` function tells the LLM to pick the "Best matching theme ID from available themes" — there's no instruction to leave `theme_id` as null when the response doesn't actually relate to any configured theme. So when the employee's first reply is a general mood follow-up like "Yeah things have been stressful," the classifier picks whichever theme sounds closest (e.g., "Changes & Recommendations" for stress/workload talk). This inflates that theme's exchange count.

**The fix we already made (≥2 exchanges per theme)** helps prevent premature closing, but it does NOT fix the mislabeling itself. If 2 mood-warmup exchanges get tagged to "Changes & Recommendations," the system thinks that theme has 2 exchanges of depth when it has zero real exploration.

## Problem 2: No concept of "warmup" / non-theme exchanges

The first 1-2 exchanges are mood follow-ups by design. They aren't about any specific theme — they're building rapport. But the system treats every response identically and tries to classify it against themes.

## Proposed Fix

### Step 1: Allow null theme_id in extract-signals
**File**: `supabase/functions/extract-signals/index.ts`

Update the system prompt and tool schema to explicitly instruct:
- "If the response is a general mood check-in, icebreaker, or doesn't substantively discuss any of the listed themes, set `theme_id` to `null`."
- Make the theme_id description say "Best matching theme ID, or null if the response is general/warmup and doesn't clearly relate to a specific theme."

### Step 2: Handle null-theme exchanges in completion logic
**File**: `supabase/functions/chat/index.ts`

No changes needed — `shouldCompleteBasedOnThemes` already filters on `r.theme_id` being truthy. Null-theme responses are already excluded from theme counts. The fix in Step 1 alone solves the inflation problem.

### Step 3: Adjust context-prompts for early exchanges
**File**: `supabase/functions/chat/context-prompts.ts`

When `exchangeCount <= 2` and no themes have been discussed yet, add an adaptive instruction: "You are still in the warm-up phase. Continue building rapport before transitioning to the first theme." This prevents the AI from rushing into themes too early.

## Expected Outcome

- First 1-2 exchanges tagged as null theme (warmup) — not counted toward any theme's depth
- Theme depth counts become accurate — only exchanges that genuinely discuss a theme count
- The ≥2-depth requirement per theme now works correctly since warmup responses won't inflate counts
- The AI gets explicit guidance to not rush into themes during the opening

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-signals/index.ts` | Update prompt to allow null theme_id for warmup/general responses |
| `supabase/functions/chat/context-prompts.ts` | Add warmup-phase adaptive instruction for early exchanges |

