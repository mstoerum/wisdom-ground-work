

# Phase 2: Synthesize-Session Edge Function & Session Syntheses Table

## What This Does

Replaces the current `analyze-session` edge function (which writes to `session_insights`) with a richer `synthesize-session` function that consumes **opinion units from Phase 1** instead of raw response text. This produces deeper per-session narratives including emotional arc, theme coverage analysis, and participant engagement quality — all stored in a new `session_syntheses` table.

The existing `session_insights` table and UI code continue working (backward-compatible writes).

## Implementation

### 1. Database Migration

Create `session_syntheses` table:

```sql
CREATE TABLE public.session_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  survey_id uuid NOT NULL,
  narrative_summary text NOT NULL,        -- 2-3 sentence human-readable summary
  emotional_arc jsonb DEFAULT '[]',       -- [{position: 0.0-1.0, sentiment: -1..1, label: "opening"}]
  themes_explored jsonb DEFAULT '[]',     -- [{theme_id, theme_name, opinion_count, avg_sentiment}]
  key_quotes jsonb DEFAULT '[]',          -- verbatim quotes with context
  root_causes jsonb DEFAULT '[]',         -- [{cause, evidence_count, severity}]
  recommended_actions jsonb DEFAULT '[]', -- [{action, priority, timeframe, evidence}]
  engagement_quality jsonb DEFAULT '{}',  -- {depth_score, openness_score, avg_response_length}
  escalation_summary jsonb DEFAULT '{}',  -- {flag_count, urgent_count, top_concerns}
  sentiment_trajectory text DEFAULT 'stable', -- improving/declining/stable/mixed
  confidence_score integer,
  opinion_units_analyzed integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_syntheses ENABLE ROW LEVEL SECURITY;

-- HR access
CREATE POLICY "HR access to session syntheses"
  ON public.session_syntheses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'hr_admin') OR has_role(auth.uid(), 'hr_analyst'));

-- Service role insert
CREATE POLICY "Service role manage session syntheses"
  ON public.session_syntheses FOR ALL
  TO public
  WITH CHECK (true);
```

### 2. Create `supabase/functions/synthesize-session/index.ts`

Key differences from current `analyze-session`:
- **Inputs opinion units** (from Phase 1) instead of raw response text — richer, pre-classified data
- **Computes emotional arc** by ordering opinion units chronologically and mapping sentiment trajectory
- **Theme coverage analysis** — counts opinion units per theme, calculates per-theme sentiment
- **Engagement quality metrics** — average response length, depth indicators, openness signals
- **Escalation summary** — aggregates flag/urgent counts from opinion units
- **Backward-compatible write** to `session_insights` table so existing SessionDetailPanel keeps working

LLM call uses `gemini-2.5-flash` with a tool-calling schema for structured output. The prompt receives:
- Session metadata (moods, duration)
- All opinion units for the session (aspect, sentiment, intensity, escalation)
- Response count and theme distribution

### 3. Wire Session Completion Trigger

Update `src/hooks/useConversation.ts` → `endConversation()`:
- After marking session as `completed`, fire `synthesize-session` via `supabase.functions.invoke()` in background
- Non-blocking — don't await the result

### 4. Update SessionDetailPanel to Show Richer Data

Update `src/components/hr/analytics/SessionDetailPanel.tsx`:
- Query `session_syntheses` (falling back to `session_insights` if not yet synthesized)
- Display narrative summary, emotional arc, engagement quality, escalation summary
- Show theme coverage breakdown

### 5. Update Pipeline Runs Status

The `synthesize-session` function updates `pipeline_runs.synthesis_completed_at` when done.

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/synthesize-session/index.ts` |
| Create | Migration for `session_syntheses` table |
| Modify | `src/hooks/useConversation.ts` — add synthesis trigger on session end |
| Modify | `src/components/hr/analytics/SessionDetailPanel.tsx` — display richer synthesis data |
| Modify | `src/components/hr/analytics/SessionExplorer.tsx` — read from `session_syntheses` for trajectory |

