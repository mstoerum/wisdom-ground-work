

# Phase 4: Interpret-Survey Edge Function

## What This Does

Replaces the legacy `deep-analytics` edge function with `interpret-survey` — a function that synthesizes **pre-processed pipeline data** (session syntheses, discovered clusters, opinion units) instead of re-analyzing raw response text. This produces higher-quality, evidence-backed survey-level insights.

## Key Difference from `deep-analytics`

The current `deep-analytics` reads raw `responses` and `session_insights` (v1 tables) and sends text to the LLM. The new function reads from:
- `session_syntheses` — per-session narratives, emotional arcs, engagement quality
- `discovered_clusters` — inductively grouped themes with sentiment spread and escalation counts
- `opinion_units` — aggregate stats (total units, actionable count, escalation breakdown)

This means the LLM receives structured, pre-classified data instead of raw text, producing more accurate and grounded insights.

## Implementation

### 1. Create `supabase/functions/interpret-survey/index.ts`

Data fetched:
- Survey metadata + configured themes
- All `session_syntheses` for the survey (narratives, trajectories, engagement scores, escalation summaries)
- All `discovered_clusters` (labels, summaries, sentiment, polarization, emerging flag)
- Aggregate opinion unit stats (count, avg sentiment, actionable %, escalation breakdown)

LLM prompt receives a structured context block built from this data (no raw employee text). Tool-calling schema matches the existing `survey_analytics` table columns: `executive_summary`, `top_themes`, `sentiment_trends`, `cultural_insights`, `risk_factors`, `opportunities`, `strategic_recommendations`, `participation_analysis`, `confidence_score`.

Writes to `survey_analytics` table (same as `deep-analytics` — backward compatible). Also updates `pipeline_runs.interpretation_completed_at`.

### 2. Add Cascade Trigger in `discover-themes`

After storing clusters and updating `pipeline_runs.clustering_completed_at`, invoke `interpret-survey` via fetch to the Supabase functions URL. Non-blocking (fire-and-forget with `EdgeRuntime.waitUntil` pattern).

### 3. Update `supabase/config.toml`

Add `[functions.interpret-survey]` with `verify_jwt = false`.

### 4. Wire Analytics Dashboard Refresh

The existing `useSurveyAnalytics` hook already reads from `survey_analytics` — no changes needed there. But add a manual "Re-analyze" button trigger that calls `interpret-survey` instead of `deep-analytics`.

Update `src/components/hr/analytics/AnalyticsRefreshBar.tsx` (or equivalent) to invoke `interpret-survey`.

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/interpret-survey/index.ts` |
| Modify | `supabase/functions/discover-themes/index.ts` — cascade trigger |
| Modify | `supabase/config.toml` — add function config |
| Modify | Analytics refresh component — point to new function |

## Technical Details

- Model: `google/gemini-2.5-flash`
- Tool schema omits `additionalProperties: false` (Gemini constraint from memory)
- Upserts into `survey_analytics` (delete old + insert new for the survey)
- Logs pipeline run status transitions

