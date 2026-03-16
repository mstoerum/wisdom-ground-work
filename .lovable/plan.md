

## Plan: Fix Interview Closing Logic — Gate on Theme Coverage

The problem is on line 436-437: `exchangeCount >= 8` injects "Start moving toward a natural close if themes are covered" — but the AI interprets this as a closing signal even when themes remain. The phrasing is ambiguous and fires too early.

### Changes in `supabase/functions/chat/context-prompts.ts`

**Lines 436-439** — Replace the adaptive instructions block with theme-coverage-gated logic:

1. **Remove** the `exchangeCount >= 8` closing signal (line 436-437)
2. **Replace** with two distinct conditions:
   - If `uncoveredThemes.length === 0`: inject "All themes have been covered. You may now begin closing the conversation using the closing flow described in your instructions."
   - If `exchangeCount >= 8 AND uncoveredThemes.length > 0`: inject a low-coverage warning nudge: "You have discussed X of Y themes after Z exchanges. N themes remain: [names]. Prioritize transitioning to uncovered themes — use shorter follow-ups on the current theme if needed."
3. **Remove** the separate uncovered-themes block (lines 438-439) since it's now folded into the new logic

**Line 382** — Soften the per-theme transition from `mustTransition` (hard MUST at ≥4) to a suggestion:
- Change `currentThemeCount >= 4` to `currentThemeCount >= 3`
- Update the ADAPTIVE INSTRUCTIONS wording from "MUST transition NOW" to a softer nudge when uncovered themes remain

**Deploy** the `chat` edge function after changes.

