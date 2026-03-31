

# Phase 3: Discover-Themes (Inductive Clustering)

## What This Does

Replaces the current static theme assignment (each response mapped to one pre-defined `survey_theme`) with LLM-based clustering that groups opinion units into **discovered clusters** — patterns that emerge from the data rather than being pre-defined. This surfaces themes HR didn't think to ask about.

## Current Problem

Right now, `extract-signals` assigns each opinion unit to the closest `survey_theme`. If employees talk about something that doesn't map to a configured theme (e.g., "onboarding confusion" when no onboarding theme exists), it gets force-fitted into the nearest theme, losing signal.

## Implementation

### 1. Database Migration

Create `discovered_clusters` table:

```sql
CREATE TABLE public.discovered_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL,
  pipeline_run_id uuid REFERENCES pipeline_runs(id),
  cluster_label text NOT NULL,           -- LLM-generated name
  cluster_summary text,                  -- 1-2 sentence description
  opinion_unit_ids uuid[] DEFAULT '{}',  -- which units belong
  unit_count integer DEFAULT 0,
  avg_sentiment numeric,
  sentiment_spread numeric,              -- polarization indicator
  escalation_count integer DEFAULT 0,
  representative_quotes jsonb DEFAULT '[]',
  related_theme_id uuid REFERENCES survey_themes(id), -- nearest configured theme, if any
  is_emerging boolean DEFAULT false,     -- true if no matching survey_theme
  created_at timestamptz DEFAULT now()
);
```

### 2. Edge Function: `discover-themes`

- Fetches all opinion units for the survey
- Sends them to `gemini-2.5-flash` with a clustering prompt: "Group these opinion units into coherent clusters by shared concern/topic"
- LLM returns cluster assignments with labels and summaries
- Writes to `discovered_clusters` table
- Marks clusters as `is_emerging = true` when they don't map to any existing `survey_theme`
- Updates `pipeline_runs.clustering_completed_at`

### 3. Cascade Trigger

`synthesize-session` already runs per-session. After all sessions for a survey are synthesized, trigger `discover-themes` once for the whole survey. This can be wired via a check in the synthesize function: "if all sessions are done, invoke discover-themes."

### 4. UI: Theme Grid Enhancement

Update the existing `ThemeGrid` component to show discovered clusters alongside configured themes, with emerging clusters highlighted with a badge.

## Files

| Action | File |
|--------|------|
| Create | `supabase/functions/discover-themes/index.ts` |
| Create | Migration for `discovered_clusters` table |
| Modify | `supabase/functions/synthesize-session/index.ts` — add cascade trigger |
| Modify | `src/components/hr/analytics/ThemeGrid.tsx` — show discovered clusters |
| Modify | `src/components/hr/analytics/ThemeCard.tsx` — emerging cluster badge |

## Effort

Roughly one implementation session. The LLM clustering prompt is the core work; the rest is table creation and UI wiring.

