

## Fix: NaN Values in Public Analytics View

**Problem**: The edge function returns themes with fields `themeId`, `themeName`, `healthIndex` but `HybridInsightsView` expects `ThemeInsight` shape with `id`, `name`, `avgSentiment`. Similarly, sentiment uses `averageScore` instead of `avgScore`.

**Single file change: `src/pages/PublicAnalytics.tsx`**

Add mapping logic before passing data to `HybridInsightsView`:

1. Map each theme from edge function format to `ThemeInsight`:
   - `themeId` → `id`
   - `themeName` → `name`  
   - `healthIndex` → `avgSentiment` (fallback to 50)
   - Add missing fields: `urgencyCount: 0`, `keySignals: { concerns: [], positives: [], other: [] }`

2. Map sentiment:
   - `averageScore` → `avgScore`
   - Add `moodImprovement: 0`

No database or edge function changes needed.

