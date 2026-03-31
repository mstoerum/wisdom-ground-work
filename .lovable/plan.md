

# Analytics Pipeline v2 — Implementation Status

## Pipeline Stages

| Phase | Function | Status | Description |
|-------|----------|--------|-------------|
| 1 | `extract-signals` | ✅ Complete | Decomposes responses into atomic opinion units |
| 2 | `synthesize-session` | ✅ Complete | Per-session narrative synthesis from opinion units |
| 3 | `discover-themes` | ✅ Complete | Inductive clustering of opinion units into themes |
| 4 | `interpret-survey` | ✅ Complete | Survey-level strategic interpretation from pipeline data |

## Pipeline Flow

```
Response saved → extract-signals (per response)
Session ended → synthesize-session (per session)
All sessions synthesized → discover-themes (per survey)
Clustering complete → interpret-survey (per survey)
```

## Tables

| Table | Purpose |
|-------|---------|
| `opinion_units` | Atomic feedback fragments with sentiment, aspect, escalation |
| `session_syntheses` | Per-session narratives, emotional arcs, engagement quality |
| `discovered_clusters` | Inductively grouped themes with emerging pattern detection |
| `survey_analytics` | Survey-level strategic insights (backward compatible) |
| `pipeline_runs` | Pipeline status tracking with per-stage timestamps |

## Key Design Decisions

- All LLM calls use `google/gemini-2.5-flash` via Lovable AI gateway
- Tool-calling (not JSON mode) for structured output — avoids Gemini schema constraints
- Each stage cascades to the next via fire-and-forget fetch calls
- `survey_analytics` table reused from legacy `deep-analytics` for backward compatibility
- Pipeline runs tracked with per-stage completion timestamps

## Next Steps

- Connect Story Report generator to pipeline data (session syntheses + clusters)
- Add pipeline status indicator to analytics dashboard
- Consider batch re-processing for historical surveys
