

# Soundboks Pilot: Deep Analysis of Responses and Analytics Dashboard

## Data Summary

- **Survey**: Soundboks Survey Pilot (employee_satisfaction type)
- **Sessions**: 5 conversations, all via public link
- **Responses**: 54 total across 4 themes (Contribution: 15, Working Experience: 22, Optimism: 4, Mindfulness: 8)
- **Themes**: Contribution, Mindfulness, Optimism, Working Experience
- **Narrative report**: Generated with 6 chapters (Voices, Landscape, Frictions, Root Causes, Momentum, Looking Forward)
- **Theme analytics**: Generated for all 4 themes with health indices and signals

---

## Critical Bugs Found

### Bug 1: Urgency detection always returns `true`

**Severity: Critical** — 49 of 54 responses are incorrectly flagged as `urgency_escalated = true`.

The `detectUrgency` function in `chat/index.ts` line 424:
```
return urgencyResponse.toLowerCase().includes('urgent');
```
The LLM replies "not-urgent" for normal responses, but "not-urgent" **contains** the substring "urgent", so the check always returns `true`.

**Fix**: Change to `return urgencyResponse.toLowerCase().includes('urgent') && !urgencyResponse.toLowerCase().includes('not-urgent')` — or better, check for exact match / use `=== 'urgent'` after trimming.

**Impact**: The analytics dashboard shows inflated urgent response counts. The `UrgentResponsesPanel` and `AlertSystem` would show false alarms. The escalation_log table likely has 49 false entries.

### Bug 2: All 5 sessions stuck at "active" — none completed

No session has `status = 'completed'`. The completion logic in `useChatAPI.ts` updates the session status to "completed" when the user confirms they're done, but it appears users are closing the browser before the final completion step triggers.

**Impact**: 
- The `participation.completed` metric shows **0** instead of 5
- `completionRate` shows **0%** 
- The `trigger_session_analysis` DB trigger (which fires on status change to "completed") **never fires**, meaning per-session AI insights (`session_insights`) are empty
- The dashboard's empty state logic may incorrectly downplay data availability

### Bug 3: `current_responses` counter on public link stuck at 0

The `public_survey_links` table shows `current_responses: 0` despite 54 responses across 5 sessions. The `increment_link_responses` function is not being called.

---

## Analytics Dashboard Gaps

### Gap 1: No `survey_analytics` or `aggregated_signals` data
These tables are empty for this survey. The `deep-analytics` edge function (which populates executive summaries, strategic recommendations, and semantic signals) has not been triggered. This means the "Drivers" tab and deeper signal analysis panels would be empty.

### Gap 2: Sentiment score distribution is too coarse
All positive responses get exactly 75, all neutral get 50, all negative get 25. There's no granularity within sentiment buckets. The `analyzeSentiment` function appears to map to fixed scores, missing nuance (e.g., "Amazing — I clearly understood" vs "a good portion" both get 75).

### Gap 3: Theme distribution heavily skewed
Working Experience has 22 responses (41%), Optimism only has 4 (7%). The AI seems to over-classify responses into Working Experience. Some responses like "A colleague tested something for me" should arguably be Contribution, not Working Experience.

---

## What the Dashboard Gets Right

- **Theme analytics** with health indices are generated and meaningful (Optimism: 100/thriving, Working Experience: 75/stable, Contribution: 80/stable, Mindfulness: 81/stable)
- **Narrative report** is well-structured with 6 chapters, capturing real insights like part-time employee disconnect and external dependency blockers
- **Root causes** in theme_analytics correctly identify issues like "limited project visibility" and "inconsistent performance feedback"
- **The qualitative insights are genuinely useful** — the AI correctly identifies that colleagues helping each other is a strength, and that external dependencies cause friction

---

## Recommended Fixes (Priority Order)

### 1. Fix urgency detection (Critical)
**File**: `supabase/functions/chat/index.ts`, line 424

Change the substring check to an exact-match check so "not-urgent" is not falsely detected as urgent. Also run a data migration to fix the 49 incorrectly flagged responses.

### 2. Auto-complete sessions on conversation end
**File**: `supabase/functions/chat/index.ts`

When the AI generates a closing/goodbye message (detected by `isFinalResponse` or `isCompletionConfirmation`), mark the session as `completed` server-side in the edge function, not just client-side. This ensures the `trigger_session_analysis` fires even if the user closes their browser.

### 3. Fix the `increment_link_responses` call
Ensure the public survey flow calls this function when a session starts or completes, so participation counts are accurate on the public link.

### 4. Trigger deep analytics
Either auto-trigger or provide a manual button to run the `deep-analytics` edge function for surveys with 5+ completed sessions, populating `survey_analytics` and `aggregated_signals`.

### 5. Improve sentiment score granularity
Update the `analyzeSentiment` function to return a score on a continuous scale (0-100) rather than mapping to fixed 25/50/75 buckets. This would make sentiment charts and averages more meaningful.

### 6. Review theme detection accuracy
The theme classifier is over-assigning to "Working Experience" (the broadest theme). Consider adding the theme descriptions to the detection prompt so the LLM can better differentiate between Contribution ("feeling useful") and Working Experience ("broad professional experience").

---

## Technical Details

| Metric | Current Value | Expected |
|--------|--------------|----------|
| Sessions | 5 active, 0 completed | 5 completed |
| Responses | 54 | 54 (correct) |
| Urgency flagged | 49/54 (91%) | ~0-2 (actual urgent) |
| Public link counter | 0 | 5 |
| Session insights | 0 | 5 (one per session) |
| Survey analytics | empty | populated |
| Aggregated signals | empty | populated |

