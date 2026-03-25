

# Data Migration & Deep Analytics Trigger

## Current State (Verified)

**Correct survey (26304bb2 — Soundboks Survey Pilot):**
- 49 responses with false `urgency_escalated = true`
- 49 entries in `escalation_log`
- 5 sessions stuck at `active` with no `ended_at`
- Public link counter at 0 (should be 5)

**Wrong survey (f92618e1 — Soundboks test):**
- 28 sessions marked `completed` with `ended_at` set — these appear to have timestamps consistent with the previous erroneous migration (set to last response time)
- Public link counter at 30 — unclear if this was inflated by the migration

## Implementation Steps

### Step 1: Fix Soundboks Survey Pilot data

Five data operations using the insert/update tool:

1. **Clear false urgency flags** — `UPDATE responses SET urgency_escalated = false WHERE survey_id = '26304bb2-...' AND urgency_escalated = true`
2. **Delete false escalation entries** — `DELETE FROM escalation_log WHERE response_id IN (SELECT id FROM responses WHERE survey_id = '26304bb2-...')`
3. **Mark 5 sessions as completed** — Set `status = 'completed'` and `ended_at` to each session's last response timestamp:
   - `6abc1e3b` → `2026-03-23 15:44:51.772+00`
   - `bc434cbe` → `2026-03-25 09:08:13.696+00`
   - `86206459` → `2026-03-25 07:54:38.427+00`
   - `857cc662` → `2026-03-25 08:36:53.13+00`
   - `f2e9c94a` → `2026-03-25 09:25:55.377+00`
4. **Fix public link counter** — `UPDATE public_survey_links SET current_responses = 5 WHERE id = '364969a6-...'`

### Step 2: Revert wrong survey changes

1. **Reset sessions** — `UPDATE conversation_sessions SET status = 'active', ended_at = NULL WHERE survey_id = 'f92618e1-...' AND status = 'completed'`
2. **Reset link counter** — `UPDATE public_survey_links SET current_responses = 0 WHERE survey_id = 'f92618e1-...'`

### Step 3: Trigger deep-analytics

Call the `deep-analytics` edge function via `curl_edge_functions` with `{ "survey_id": "26304bb2-5157-462d-b44f-b9373ae6e862" }` to populate `survey_analytics` and `aggregated_signals`.

### Step 4: Verify results

Query `survey_analytics`, `session_insights`, and `theme_analytics` to confirm data was populated correctly after the triggers fire (session completion triggers `analyze-session` and `analyze-theme` automatically).

