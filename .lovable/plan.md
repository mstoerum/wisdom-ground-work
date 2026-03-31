

# Assessment: Claude's Narrative Report v2 Proposal

## Verdict: Strong upgrade, mostly aligned with what we've already built — with key additions worth adopting

---

## What Claude Proposes

A replacement `generate-narrative-report` edge function (Stage 6) that **writes prose from pre-analyzed pipeline data** instead of re-analyzing raw responses. This is the logical capstone for Phases 1-4 we've already implemented.

---

## Comparison: Current vs Proposed

| Aspect | Current `generate-narrative-report` | Proposed v2 |
|--------|-------------------------------------|-------------|
| **Data source** | Raw `responses` + `survey_analytics` + `theme_analytics` + `session_insights` (v1 tables) | `discovered_clusters` + `session_syntheses` + `survey_analytics` (v2 pipeline tables) |
| **LLM role** | Analyzes AND writes (double work) | Writes only — all analysis pre-done by Phases 1-4 |
| **Evidence trails** | Weak — `evidence_ids` are response IDs but not cluster-linked | Strong — each insight maps to a `cluster_id` with corrected `sample_size` and `agreement_percentage` |
| **Anonymity** | No k-anonymity checks | K-anonymity enforcement (k=3 for small orgs, k=5 for larger) — quotes suppressed below threshold |
| **Model** | Lovable AI gateway (`gpt-5`) | Direct Gemini API (`gemini-2.5-pro`) |
| **Audience levels** | 2 (executive, manager) | 3 (executive, hr_leadership, detailed) |
| **Chapters** | 6 (voices, landscape, frictions, root_causes, forward, commitment) | 5 (drops commitment — handled separately) |
| **New field** | — | `report_summary` (2-3 sentence executive summary) |

---

## What's Genuinely Valuable

1. **K-anonymity enforcement** — The `isKAnonymous()` and `selectSafeQuotes()` helpers are excellent. Currently our reports have no programmatic anonymity guardrails. This is a real privacy improvement.

2. **Cluster-linked evidence trails** — Each insight gets a `cluster_id` and corrected `sample_size`. This enables drill-down from report → cluster → opinion units in the UI.

3. **Evidence enrichment post-LLM** — The code validates that LLM-returned `evidence_ids` actually exist, falls back to cluster evidence if not, and caps `sample_size` at `totalParticipants` to prevent hallucinated stats. Smart.

4. **Report summary field** — A `report_summary` column on `narrative_reports` gives us a one-liner for list views and sharing.

5. **Writing-only prompt design** — The system prompt explicitly says "ALL ANALYSIS IS ALREADY DONE — your job is to write." This prevents the LLM from contradicting Phase 4's interpretation.

---

## What Needs Adaptation

### Schema mismatches (Claude assumed different table/column names)

| Claude assumes | We actually have |
|----------------|-----------------|
| `survey_interpretations` table | `survey_analytics` table |
| `discovered_clusters.label` | `discovered_clusters.cluster_label` |
| `discovered_clusters.description` | `discovered_clusters.cluster_summary` |
| `discovered_clusters.valence` | Not present (we have `avg_sentiment`) |
| `discovered_clusters.mean_sentiment` | `discovered_clusters.avg_sentiment` |
| `discovered_clusters.sentiment_std` | `discovered_clusters.sentiment_spread` |
| `discovered_clusters.mapped_theme_id` | `discovered_clusters.related_theme_id` |
| `themes` table | `survey_themes` table |
| `session_syntheses.session_narrative` | `session_syntheses.narrative_summary` |
| `session_syntheses.retention_signal` | Not present |
| `session_syntheses.exchange_count` | Not present |
| `session_syntheses.dominant_aspects` | Not present |
| `interpretation.organizational_narrative` | `survey_analytics.executive_summary` |
| `interpretation.systemic_patterns` | Not present (closest: `survey_analytics.top_themes`) |
| `interpretation.risk_assessment` | `survey_analytics.risk_factors` |
| `interpretation.strategic_recommendations` | `survey_analytics.strategic_recommendations` |
| `interpretation.data_sufficiency` | Not present |

### API approach

Claude uses direct Gemini API with `GEMINI_API_KEY`. Our pipeline already uses this pattern in all edge functions, so this is consistent.

### Missing `commitment` chapter

Claude drops the Commitment chapter (6→5). Our UI and design system (`CHAPTER_STRUCTURE` in `reportDesignSystem.ts`) expects 6 chapters including commitment. We should keep 6 chapters for backward compatibility.

### Views reference non-existent columns

The SQL migration creates views (`v_report_evidence_chain`, `v_cluster_summary`) that reference columns like `dc.label`, `dc.valence`, `dc.mean_sentiment`, `dc.mapping_confidence`, `t.name` from a `themes` table — none of which match our schema. These views would fail.

---

## Recommendation

**Adopt the approach, adapt the implementation.** Specifically:

1. **Take**: K-anonymity helpers, cluster-linked evidence enrichment, report_summary field, writing-only prompt design, 3 audience levels
2. **Adapt**: All table/column references to match our actual schema
3. **Keep**: 6-chapter structure (including commitment), Gemini API pattern (already consistent)
4. **Skip**: The SQL views (they reference wrong columns; we can add correct views later if needed)
5. **Skip**: The `pipeline_runs` unique constraint additions (we handle this differently)

### Implementation would involve:

| Action | File |
|--------|------|
| Create | Migration: add `report_summary` column to `narrative_reports` |
| Rewrite | `supabase/functions/generate-narrative-report/index.ts` — new v2 that reads pipeline tables |
| Keep | UI components unchanged (backward-compatible `chapters[]` format) |

### Effort

Single implementation session. The prompt engineering is the bulk of the work; data fetching is straightforward once column names are corrected.

---

## Summary

| Dimension | Assessment |
|-----------|-----------|
| Possible? | Yes — after correcting ~15 column/table name mismatches |
| Beneficial? | Yes — k-anonymity, evidence trails, and write-only prompting are real improvements |
| Right move? | Yes — this is the natural Stage 6 completion of the pipeline we built in Phases 1-4 |
| Risk | Low — output format is backward-compatible with existing UI |
| Effort | ~1 session |

