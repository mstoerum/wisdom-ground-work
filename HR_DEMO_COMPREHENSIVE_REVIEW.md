# HR Demo Comprehensive Review & Fix Plan

## Issues Identified

### 1. **CRITICAL: Survey ID Mismatch Between Generator and Analytics**

**Problem**: The `DemoAnalytics` component passes the string `'demo-survey-001'` to `MockDataGenerator`, which then gets converted to UUID `'00000000-0000-0000-0000-000000000001'` in `generateMockConversations`. However, the analytics hooks use a different survey ID.

**Location**: 
- `DemoAnalytics.tsx` lines 62-71 and 404
- `generateMockConversations.ts` lines 178, 332

**Impact**: Mock data is created with one survey ID, but analytics queries use a potentially different one, causing placeholder data to always show.

**Evidence**:
```typescript
// DemoAnalytics.tsx line 404
<MockDataGenerator 
  surveyId={DEMO_SURVEY_ID_STRING}  // Passes 'demo-survey-001'
  onDataGenerated={handleDataGenerated}
/>

// DemoAnalytics.tsx lines 75-79  
const realAnalytics = useConversationAnalytics({
  surveyId: DEMO_SURVEY_ID,  // Uses UUID '00000000-0000-0000-0000-000000000001'
  _refreshKey: dataRefreshKey,
} as any);
```

### 2. **Mock Data Survey ID Inconsistency**

**Problem**: The `MockDataGenerator` receives `'demo-survey-001'` as a string, which should be converted to UUID, but there's potential for inconsistency in how this conversion happens across different components.

**Location**: `MockDataGenerator.tsx` lines 31-33, 96-99, 173-176

**Impact**: Creates confusion and potential data mismatches.

### 3. **Placeholder Data Not Being Replaced**

**Problem**: Even after mock data generation, the `useRealData` flag might not switch to `true` because:
1. Query invalidation may not be sufficient
2. The `dataRefreshKey` mechanism might not trigger proper re-evaluation
3. Analytics hooks might be caching empty results

**Location**: `DemoAnalytics.tsx` line 88-89

**Evidence**:
```typescript
const useRealData = realAnalytics.responses.length > 0 && realAnalytics.sessions.length > 0;
```

This check depends on `realAnalytics` being properly updated after mock data generation.

### 4. **Insufficient Query Invalidation**

**Problem**: The `handleDataGenerated` function invalidates queries but doesn't ensure the hooks actually refetch before re-rendering.

**Location**: `DemoAnalytics.tsx` lines 283-328

**Impact**: UI might render with stale placeholder data even after mock data is created.

### 5. **Mock Data Generation Quality Issues**

**Problem**: While the response templates are good, there are potential issues:
1. Sentiment scores are converted from 0-1 to 0-100 inconsistently
2. Department data might not be properly associated
3. Theme IDs might not be correctly linked

**Location**: `generateMockConversations.ts` lines 196-204, 292

**Evidence**:
```typescript
// Converts to 0-1 for database
const dbSentimentScore = sentimentScore / 100;
```

But in analytics, scores are expected in 0-100 range and need reconversion.

### 6. **RLS Policy May Be Blocking Analytics Access**

**Problem**: The mock conversations are created with `employee_id` set to the current user (for RLS compliance), but analytics queries might be trying to access ALL conversations for the demo survey, which RLS might block.

**Location**: `generateMockConversations.ts` line 225

**Impact**: Analytics hooks return empty arrays even though data exists in database.

## Recommended Fixes

### Fix 1: Standardize Survey ID Usage (CRITICAL)

**File**: `src/components/demo/DemoAnalytics.tsx`

Change the MockDataGenerator call to use the UUID directly:

```typescript
<MockDataGenerator 
  surveyId={DEMO_SURVEY_ID}  // Use UUID instead of string
  onDataGenerated={handleDataGenerated}
/>
```

And update all references to use the same UUID constant consistently.

### Fix 2: Add Debug Logging to Identify Data Flow Issues

Add console logging to track:
1. What survey ID is being used for generation
2. What survey ID is being used for analytics queries
3. How many records are actually in the database
4. What the analytics hooks are returning

### Fix 3: Improve Query Refetch Logic

**File**: `src/components/demo/DemoAnalytics.tsx`

Update `handleDataGenerated` to:
1. Invalidate queries
2. Force refetch with awaiting
3. Add explicit state update after refetch completes
4. Verify data was loaded before showing UI

### Fix 4: Fix Sentiment Score Consistency

**File**: `src/hooks/useAnalytics.ts`

Ensure sentiment score conversion is consistent:
```typescript
// Lines 92-96
const normalizedScore = score <= 1 ? score * 100 : score;
```

This is correct, but verify it's applied everywhere.

### Fix 5: Check RLS Policies for Analytics Queries

Need to verify that the RLS policies on `conversation_sessions` and `responses` tables allow HR admins to see all demo survey data, not just data where `employee_id` matches.

### Fix 6: Add Data Verification Step

After generating mock data, add a verification step that:
1. Counts records in database
2. Attempts to fetch them with the same query as analytics
3. Reports any discrepancies
4. Shows clear error messages if RLS is blocking access

## Testing Plan

1. **Clear all demo data**
2. **Verify placeholder analytics show**
3. **Generate mock data**
4. **Verify database has records** (direct query)
5. **Verify analytics hooks return data**
6. **Verify UI switches to real data mode**
7. **Verify all analytics tabs show generated data**
8. **Regenerate data and verify it replaces old data**
9. **Clear data and verify return to placeholder mode**

## Priority Actions

1. ✅ **IMMEDIATE**: Fix survey ID consistency (Fix 1)
2. ✅ **HIGH**: Add debug logging (Fix 2)
3. ✅ **HIGH**: Improve refetch logic (Fix 3)
4. ✅ **MEDIUM**: Verify RLS policies (Fix 5)
5. ✅ **LOW**: Add verification step (Fix 6)
