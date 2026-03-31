

# Fix: Analytics Crash When Selecting Pilot Survey

## Root Cause

The `SurveyAnalyticsDashboard` component crashes because the `interpret-survey` edge function (Phase 4) produces data with different field names than the component expects. When accessing properties like `theme.importance`, `risk.likelihood`, or `rec.key_stakeholders` on objects that don't have those fields, the code crashes on `undefined.color` or similar property access.

### Specific mismatches in `survey_analytics` data:

| Field | Dashboard expects | Pipeline produces |
|-------|------------------|-------------------|
| `top_themes[].importance` | `'critical'\|'high'\|'medium'\|'low'` | Missing (has `intensity` instead) |
| `top_themes[].key_finding` | string | Missing (has `summary` instead) |
| `risk_factors[].likelihood` | `'high'\|'medium'\|'low'` | Missing (has `evidence` instead) |
| `risk_factors[].impact_area` | string | Missing (has `mitigation` instead) |
| `opportunities[].potential_impact` | `'high'\|'medium'\|'low'` | `impact` (different name) |
| `opportunities[].effort_required` | `'low'\|'medium'\|'high'` | `effort` (different name) |
| `strategic_recommendations[].priority` | `'short-term'` (hyphen) | `'short_term'` (underscore) |
| `strategic_recommendations[].expected_outcome` | string | `expected_impact` (different name) |
| `strategic_recommendations[].key_stakeholders` | string[] | Missing (has `rationale`) |
| `sentiment_trends.overall_direction` | string | `trajectory` (different name) |
| `sentiment_trends.momentum` | string | Missing |
| `sentiment_trends.inflection_points` | string[] | `notable_shifts` (different name) |

## Fix

### Modify `src/components/hr/analytics/SurveyAnalyticsDashboard.tsx`

Make all property accesses defensive with fallbacks to handle both the old expected format and the new pipeline format:

1. **Top themes**: Use `theme.importance || deriveImportance(theme.intensity)` and `theme.key_finding || theme.summary`
2. **Risk factors**: Use `risk.likelihood || 'medium'` and `risk.impact_area || risk.mitigation || ''`
3. **Opportunities**: Use `opp.potential_impact || opp.impact || 'medium'` and `opp.effort_required || opp.effort || 'medium'`
4. **Recommendations**: Normalize priority underscores to hyphens, use `rec.expected_outcome || rec.expected_impact`, use `rec.key_stakeholders || []`
5. **Sentiment trends**: Use `?.overall_direction || ?.trajectory` and `?.inflection_points || ?.notable_shifts`
6. Add null guards on all config lookups (e.g., `importanceConfig[x]?.color || ''`)

This is a UI-only fix — no edge function or schema changes needed. The component should handle any shape of data gracefully.

## Files

| Action | File |
|--------|------|
| Modify | `src/components/hr/analytics/SurveyAnalyticsDashboard.tsx` — add defensive fallbacks for all field accesses |

