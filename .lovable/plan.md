

# Analytics Refresh Enhancement Plan

## Overview

Transform the static analytics dashboard into a live, refresh-aware system that clearly shows data freshness and provides intuitive refresh controls for HR users.

---

## Current Problems

1. **Hidden refresh capability** - Real-time subscriptions exist but users don't see updates
2. **One-time theme analysis** - `autoAnalyzedRef` prevents re-analysis when new responses arrive
3. **No freshness indicators** - Users can't tell when data was last updated
4. **Narrative reports are frozen** - Once generated, no way to update without regenerating
5. **No manual refresh control** - Users must reload the page to get fresh data

---

## Proposed Solutions

### 1. Add Refresh Control Bar (P0 - Critical)

**New Component:** `src/components/hr/analytics/AnalyticsRefreshBar.tsx`

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Last updated: 2 minutes ago  •  24 responses  │  [🔄 Refresh]     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ● Live updates enabled                        │  Auto-refresh: 5m │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Shows "Last updated" with relative time (e.g., "2 minutes ago")
- Response count badge
- Manual "Refresh" button with loading state
- Live update indicator (green dot when real-time connected)
- Optional auto-refresh toggle with interval selector

---

### 2. Unified Refresh Function (P0 - Critical)

**Changes to:** `src/pages/hr/Analytics.tsx`

Create a central `refreshAllAnalytics()` function that:
- Refetches `useAnalytics` data
- Refetches `useThemeAnalytics` data
- Refetches `useNarrativeReports` data
- Refetches `useConversationAnalytics` data
- Shows toast notification on completion

Pass this down to `HybridInsightsView` as a prop.

---

### 3. Fix Theme Analytics Re-analysis (P1 - Important)

**Changes to:** `src/hooks/useThemeAnalytics.ts`

**Current Problem:**
```typescript
// This blocks re-analysis forever after first run
if (autoAnalyzedRef.current) return;
```

**Solution:**
- Reset `autoAnalyzedRef` when response count increases significantly (e.g., +5 new responses)
- Add `lastResponseCount` tracking to detect new data
- Provide `reanalyze()` function for manual re-trigger

```typescript
// Track response count changes
const lastResponseCountRef = useRef(responseCount);

useEffect(() => {
  // Reset auto-analysis flag if we have significantly more data
  if (responseCount >= lastResponseCountRef.current + 5) {
    autoAnalyzedRef.current = false;
    lastResponseCountRef.current = responseCount;
  }
}, [responseCount]);
```

---

### 4. Add Real-time to Theme Analytics (P1 - Important)

**Changes to:** `src/hooks/useThemeAnalytics.ts`

Add Supabase Realtime subscription to invalidate `theme-analytics` query when new data arrives:

```typescript
useEffect(() => {
  if (!surveyId) return;
  
  const channel = supabase
    .channel(`theme-analytics-${surveyId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'theme_analytics', filter: `survey_id=eq.${surveyId}` },
      () => queryClient.invalidateQueries({ queryKey: ['theme-analytics', surveyId] })
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [surveyId, queryClient]);
```

---

### 5. Expose Refetch from Narrative Reports (P1 - Important)

**Changes to:** `src/hooks/useNarrativeReports.ts`

Expose `refetch` from the query:

```typescript
return {
  reports,
  latestReport,
  isLoading,
  error,
  generateReport: generateReport.mutate,
  isGenerating: generateReport.isPending,
  refetch: query.refetch, // NEW: Expose refetch
};
```

---

### 6. New Data Indicator (P2 - Nice to Have)

**Changes to:** `src/components/hr/analytics/AnalyticsRefreshBar.tsx`

When real-time detects new responses but user hasn't clicked refresh:
- Show pulsing badge: "3 new responses"
- Button changes to "Refresh (3 new)"

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Last updated: 5 minutes ago  •  24 responses  │  [🔄 Refresh (3)] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ● 3 new responses available                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 7. Auto-refresh Option (P2 - Nice to Have)

**Changes to:** `src/pages/hr/Analytics.tsx` and `AnalyticsRefreshBar.tsx`

Add optional auto-refresh with configurable interval:

```typescript
const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);

useEffect(() => {
  if (!autoRefreshInterval) return;
  
  const timer = setInterval(() => {
    refreshAllAnalytics();
  }, autoRefreshInterval * 60 * 1000);
  
  return () => clearInterval(timer);
}, [autoRefreshInterval]);
```

Intervals: Off, 1 min, 5 min, 15 min

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/hr/analytics/AnalyticsRefreshBar.tsx` | Create | Refresh control bar with timestamp and controls |
| `src/hooks/useThemeAnalytics.ts` | Modify | Add real-time, fix re-analysis blocking |
| `src/hooks/useNarrativeReports.ts` | Modify | Expose refetch function |
| `src/pages/hr/Analytics.tsx` | Modify | Add unified refresh, integrate RefreshBar |
| `src/components/hr/analytics/HybridInsightsView.tsx` | Modify | Accept onRefresh prop, show loading states |

---

## Implementation Order

1. **AnalyticsRefreshBar** - Visual refresh control with timestamp
2. **Unified refresh in Analytics.tsx** - Central refresh function
3. **Fix useThemeAnalytics** - Reset auto-analysis flag on new data
4. **Real-time for theme analytics** - Automatic invalidation
5. **Expose narrative reports refetch** - Complete the refresh chain
6. **New data indicator** - Show pending updates
7. **Auto-refresh option** - Configurable polling

---

## User Experience Flow

```text
User opens Analytics
        │
        ▼
┌───────────────────────┐
│ Data loads normally   │
│ "Last updated: now"   │
└───────────────────────┘
        │
        ▼
    (Time passes, new responses come in)
        │
        ▼
┌───────────────────────┐
│ Real-time detects     │
│ "3 new responses"     │◄── Pulsing badge appears
└───────────────────────┘
        │
        ▼
    User clicks [Refresh]
        │
        ▼
┌───────────────────────┐
│ All data refetches    │
│ Theme re-analysis     │◄── If threshold met
│ "Last updated: now"   │
└───────────────────────┘
```

---

## Technical Details

### AnalyticsRefreshBar Props

```typescript
interface AnalyticsRefreshBarProps {
  lastUpdated: Date | null;
  responseCount: number;
  newResponseCount: number;
  isRefreshing: boolean;
  isLiveConnected: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number | null;
  onAutoRefreshChange: (interval: number | null) => void;
}
```

### Refresh State Management

```typescript
// In Analytics.tsx
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [newResponsesSinceUpdate, setNewResponsesSinceUpdate] = useState(0);

const refreshAllAnalytics = async () => {
  setIsRefreshing(true);
  try {
    await Promise.all([
      analyticsRefetch(),
      themeAnalyticsRefetch(),
      narrativeRefetch?.(),
      conversationRefetch(),
    ]);
    setLastUpdated(new Date());
    setNewResponsesSinceUpdate(0);
    toast.success("Analytics refreshed");
  } finally {
    setIsRefreshing(false);
  }
};
```

---

## Testing Checklist

- [ ] Refresh button triggers all data refetch
- [ ] "Last updated" timestamp updates after refresh
- [ ] Theme analysis re-triggers when response count increases by 5+
- [ ] Real-time indicator shows connected state
- [ ] New response badge appears when data arrives
- [ ] Auto-refresh works at configured intervals
- [ ] Loading states shown during refresh

