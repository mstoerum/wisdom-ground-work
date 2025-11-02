# Mock Data Generation & Analytics Issues - Fix Summary

## Problems Identified

### Issue 1: Demo Environment Not Updating After Mock Data Generation
**Root Cause:**
- `DemoAnalytics` component was conditionally passing `surveyId` to `useConversationAnalytics` hook
- When `hasRealData` was `false`, `surveyId` was set to `undefined`, preventing the hook from fetching data
- After mock data was generated, React Query cache wasn't being invalidated, so old empty results were still used
- The hook's queries weren't being refetched after data generation

**Solution:**
- Always pass `DEMO_SURVEY_ID` to the hook (not conditionally)
- Use actual data from the hook (`responses.length > 0 && sessions.length > 0`) to determine if real data exists
- Properly invalidate React Query caches when mock data is generated
- Call the hook's `refetch()` function to force a refresh

### Issue 2: Survey ID Mismatch
**Root Cause:**
- Mock data generator converts `'demo-survey-001'` to UUID format `'00000000-0000-0000-0000-000000000001'` when inserting
- `DemoAnalytics` was querying with `'demo-survey-001'` string, which doesn't match the UUID in the database
- This caused queries to return empty results even when data existed

**Solution:**
- Use the same UUID conversion logic in `DemoAnalytics` as in `generateMockConversations`
- Always query with the UUID format that matches what's actually stored in the database

### Issue 3: HR Analytics Not Processing Data
**Root Cause:**
- `useConversationAnalytics` hook's `enhancedDataQuery` returned incomplete data structure when no data was found
- Missing fields like `rootCauses`, `interventions`, `qualityMetrics`, etc. when returning early

**Solution:**
- Updated the early return in `enhancedDataQuery` to include all required fields with appropriate default values

## Changes Made

### 1. `src/components/demo/DemoAnalytics.tsx`
- Removed conditional `surveyId` - always fetch for demo survey
- Added UUID conversion logic to match `generateMockConversations`
- Added React Query cache invalidation in `handleDataGenerated`
- Updated refresh button to also invalidate caches
- Changed `useRealData` logic to check actual data from hook instead of separate state

### 2. `src/hooks/useConversationAnalytics.ts`
- Fixed early return to include all required analytics fields
- Ensures consistent data structure even when no data is found

## Testing Checklist

- [ ] Generate mock data in demo environment
- [ ] Verify analytics dashboard updates immediately after generation
- [ ] Check that all analytics tabs show real data (not mock fallbacks)
- [ ] Verify refresh button works correctly
- [ ] Confirm that themes, quotes, patterns, and other analytics are populated
- [ ] Test that analytics work when navigating away and back

## Technical Details

### Survey ID Conversion
```typescript
// In generateMockConversations.ts
const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';
const targetSurveyId = isValidUUID(surveyId) ? surveyId : DEMO_SURVEY_UUID;

// In DemoAnalytics.tsx (now matches)
const DEMO_SURVEY_ID = isValidUUID(DEMO_SURVEY_ID_STRING) 
  ? DEMO_SURVEY_ID_STRING 
  : DEMO_SURVEY_UUID;
```

### Cache Invalidation
When mock data is generated, we now invalidate:
- `['conversation-responses']`
- `['conversation-sessions']`
- `['enhanced-analytics']`
- `['survey-themes']`

And then call `realAnalytics.refetch()` to force immediate refresh.

## Expected Behavior After Fix

1. **Before mock data generation:** Demo shows mock/fallback data
2. **After clicking "Generate Mock Data":**
   - Data is inserted into database with correct UUID
   - React Query caches are invalidated
   - Analytics hook refetches data
   - Dashboard automatically updates to show real analytics
   - Badge changes from "Mock Data" to "Using Real Data (X conversations)"
3. **HR Analytics:** All tabs (Quality, Insights, Themes, Patterns, etc.) show real analyzed data from conversations
