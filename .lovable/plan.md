

## Add Story Report to Public Analytics View

**Problem**: The shared analytics page only shows the Overview tab (HybridInsightsView). The Story Report tab is missing.

### Changes

**1. Edge Function: `supabase/functions/get-public-analytics/index.ts`**

Add a query to fetch the latest `narrative_reports` row for the survey and include it in the response payload:

```ts
const { data: narrativeReport } = await supabase
  .from("narrative_reports")
  .select("*")
  .eq("survey_id", surveyId)
  .eq("is_latest", true)
  .single();
```

Add `narrativeReport` to the result object.

**2. Frontend: `src/pages/PublicAnalytics.tsx`**

- Add a 2-tab layout (Overview + Story Report) using the existing `Tabs` component
- Render `NarrativeReportViewer` in the Story Report tab in **read-only mode** (no `onRegenerateWithAudience`, no `onExport` — these are HR-only actions)
- Map the narrative report data to the `NarrativeReport` interface shape
- If no report exists, show a simple "No story report available" message

### Technical Details

- The `NarrativeReportViewer` already handles the case where no chapters exist
- Passing no `onRegenerateWithAudience` or `onExport` props hides those controls, making it naturally read-only
- No database changes needed — the edge function uses service role, bypassing RLS on `narrative_reports`

