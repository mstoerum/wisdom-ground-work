
## Deep analysis: what is going wrong now

The current villager start flow is still accidentally using the **mood-first backend branch**, even though the UI skips mood selection.

1. In `FocusedInterviewInterface`, villager auto-start calls:
   - `initializeConversation(3)`
   - request includes `initialMood: 3`

2. In `supabase/functions/chat/index.ts`, intro handling does:
   - `if (initialMood is set) -> getMoodAdaptiveResponse(...)`
   - so villager gets a mood follow-up like “Fair enough. What’s one thing you’d tweak…”
   - this is **not a direct first-theme kickoff**

3. There is a second issue in the intro fallback:
   - warm intro text in `chat/index.ts` still uses `course ? learning : work`
   - villager can fall into work wording if mood is removed and this fallback is hit

4. Intro logic is duplicated (preview + live branches), so behavior can drift.

---

## Plan to make villager start immediately with a smooth theme kickoff

### 1) Fix intro routing in backend (main root fix)
**File:** `supabase/functions/chat/index.ts`

- Create one shared intro builder (used in both preview and live intro branches).
- For `surveyType === 'villager_interview'`, **ignore `initialMood` for intro generation**.
- Generate first message as:
  - short villager welcome line
  - immediate first theme question (from `selectFirstQuestion`)
- Keep existing mood logic unchanged for employee/course surveys.

### 2) Use the dedicated warm-intro helper instead of hardcoded context string
**Files:** `supabase/functions/chat/index.ts`, `supabase/functions/chat/first-questions.ts`

- Replace manual `Hi... work/learning` string in intro branches with `buildWarmIntroduction(...)`.
- Ensure villager intro is always villager-specific and never falls back to work phrasing.
- Keep employee/course intro text exactly as-is.

### 3) Stop sending neutral mood for villager auto-start
**File:** `src/components/employee/FocusedInterviewInterface.tsx`

- In villager auto-init path, call intro initialization without `initialMood`.
- This prevents triggering mood-adaptive responses accidentally.
- Keep mood payload behavior untouched for employee/course where mood check-in still exists.

### 4) Align villager fallback behavior with “start with theme”
**File:** `src/components/employee/FocusedInterviewInterface.tsx`

- If intro request fails, use villager fallback that is theme-oriented (not mood-oriented).
- Example fallback style: short welcome + first village-theme prompt.

### 5) Verify no regressions
- Villager public flow: consent → immediate warm intro + first theme question.
- Employee and course: existing mood check-in and follow-up behavior unchanged.
- Preview mode and live mode both verified (since intro logic is shared).

---

## Technical details (implementation constraints)

- No DB migration required.
- No changes to role/auth/data policies required.
- Scope is additive and gated by `surveyType === 'villager_interview'`.
- Keep all existing employee/course logic paths untouched except for shared helper extraction where behavior is preserved.
