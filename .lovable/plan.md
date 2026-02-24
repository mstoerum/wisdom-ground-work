

# Remove MAX_EXCHANGES Hard Cap

## Problem

The current `MAX_EXCHANGES = 20` acts as a hard cutoff that forcibly ends the conversation regardless of theme coverage. This creates an unnatural abrupt ending. The conversation should end organically when all themes are adequately covered, not because an arbitrary counter was hit.

## Changes

### `supabase/functions/chat/index.ts`

1. **Remove `MAX_EXCHANGES` constant** (line 23) — delete the constant entirely.

2. **Update `shouldCompleteBasedOnThemes`** (lines 118-176):
   - Remove the `turnCount >= MAX_EXCHANGES` early-return block (lines 134-137)
   - Keep the theme-gated logic: all themes must be touched with avg depth ≥ 1 exchange per theme
   - Lower avg depth requirement from 2 to 1 (line 169) — aligns with your 1-2 follow-ups per theme preference
   - Update the hard minimum formula from `themes.length * 2` to `themes.length + 2` — a 4-theme survey can complete at turn 6 instead of 8
   - For no-themes fallback (line 125), just use `turnCount >= 8` without an upper bound

3. **Update adaptive instructions** (line 302): Remove the `MIN_EXCHANGES` check from the "near completion" prompt since there's no max cap — completion is purely theme-driven now.

4. **Update `context-prompts.ts`**: Change pacing instructions from "2-3 exchanges per theme" to "1-2 follow-ups per theme, then move on naturally." Remove word cloud transition examples; replace with natural AI-driven bridging. This ensures the AI doesn't linger on any single theme.

### Target flow for a 4-theme survey (~8-10 exchanges)

```text
Turn 1:  Opening question (Theme A)
Turn 2:  One follow-up on Theme A
Turn 3:  Natural bridge → Theme B
Turn 4:  One follow-up on Theme B
Turn 5:  Natural bridge → Theme C
Turn 6:  One follow-up on Theme C
Turn 7:  Natural bridge → Theme D
Turn 8:  One follow-up on Theme D
Turn 9:  "Anything else?" → wrap up
```

No artificial cap — if themes need more exploration, the conversation continues naturally. Completion only triggers when all themes are touched with sufficient depth.

### Files changed

| File | What changes |
|------|-------------|
| `supabase/functions/chat/index.ts` | Remove `MAX_EXCHANGES`, update `shouldCompleteBasedOnThemes` to be purely theme-gated with avg depth ≥ 1, lower hard minimum formula |
| `supabase/functions/chat/context-prompts.ts` | Update pacing to 1-2 follow-ups per theme, natural AI-driven transitions instead of word cloud |

