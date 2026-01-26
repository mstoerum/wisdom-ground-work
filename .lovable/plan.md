
# Survey Data Storage Review & Analytics Fix Plan

## Executive Summary

The analytics dashboard shows 0 responses because of **two critical issues**:
1. **Participation counts from the wrong table** - analytics query `survey_assignments`, but public survey users don't create assignments
2. **Sessions never marked completed** - users answer questions but don't click "Complete Session" (or close the browser early)

---

## Current Data Model (The Problem)

The system has **three distinct concepts** that are being conflated:

```text
+----------------------+     +------------------------+     +-------------+
| survey_assignments   |     | conversation_sessions  |     | responses   |
+----------------------+     +------------------------+     +-------------+
| One per employee     |     | One per survey attempt |     | One per     |
| Created by HR        |     | Created when user      |     | question    |
| NOT for public links |     | starts survey          |     | answered    |
+----------------------+     +------------------------+     +-------------+
       |                            |                             |
       v                            v                             v
  Analytics looks                Database shows              Actually has
  here for                       2 sessions,                 8 responses
  participation                  status: "active"            saved correctly
  → Shows 0                      → Never completed           → Data exists!
```

**Your Due Diligence survey currently has:**
- `survey_assignments`: 0 records (public link, no assignments created)
- `conversation_sessions`: 2 sessions, both status="active", ended_at=null
- `responses`: 8 responses with content, sentiment, theme_id

---

## Root Causes

### Issue 1: Wrong Table for Public Survey Participation
**File**: `src/hooks/useAnalytics.ts` (lines 232-248)

```typescript
// Current: Only counts survey_assignments
let query = supabase
  .from('survey_assignments')
  .select('id, survey_id, status, assigned_at, completed_at');
```

**Problem**: Public link users bypass `survey_assignments` entirely - they create `conversation_sessions` directly.

### Issue 2: Sessions Not Being Completed
Users answer questions (responses saved) but sessions stay "active" because:
1. Users close browser before clicking "Complete Session"
2. The completion flow requires explicit user action
3. No auto-completion fallback exists

### Issue 3: Confusing Terminology
- **"Respondent"** = A person who takes a survey = `conversation_sessions` record
- **"Response"** = An answer to a question = `responses` record

The current analytics conflates these by counting `survey_assignments` (which is neither).

---

## Proposed Solutions

### Solution 1: Hybrid Participation Counting (P0 - Critical)

**Goal**: Count participation from both `survey_assignments` AND `conversation_sessions`

**File Changes**: `src/hooks/useAnalytics.ts`

```typescript
// NEW: Hybrid participation counting
const participationQuery = useQuery({
  queryKey: ['analytics-participation', filters],
  queryFn: async () => {
    // 1. Count from survey_assignments (for assigned surveys)
    const assignmentsQuery = supabase
      .from('survey_assignments')
      .select('id, status');
    
    // 2. Count from conversation_sessions (for all including public)
    const sessionsQuery = supabase
      .from('conversation_sessions')
      .select('id, status, survey_id');
    
    if (filters.surveyId) {
      assignmentsQuery.eq('survey_id', filters.surveyId);
      sessionsQuery.eq('survey_id', filters.surveyId);
    }
    
    const [assignments, sessions] = await Promise.all([
      assignmentsQuery,
      sessionsQuery
    ]);
    
    // Prioritize sessions (actual attempts) over assignments
    const sessionData = sessions.data || [];
    return {
      totalAssigned: sessionData.length,
      completed: sessionData.filter(s => s.status === 'completed').length,
      pending: sessionData.filter(s => s.status === 'active').length,
      completionRate: sessionData.length > 0 
        ? (sessionData.filter(s => s.status === 'completed').length / sessionData.length) * 100 
        : 0,
      // NEW: Also count actual responses
      responseCount: await getResponseCount(filters.surveyId),
    };
  },
});
```

### Solution 2: Response-Based Analytics Fallback (P0 - Critical)

**Goal**: Show meaningful analytics even when sessions aren't completed

**New Logic**: If `completed_sessions === 0` but `responses > 0`, show response-based metrics instead

**File Changes**: `src/components/hr/analytics/HybridInsightsView.tsx`

```typescript
// NEW: Response-aware empty state
const hasResponses = themes.length > 0 || sentimentData.positive + sentimentData.negative > 0;
const hasCompletedSessions = participation?.completed > 0;

// Show response data even if no completed sessions
if (!hasCompletedSessions && hasResponses) {
  return <ResponseBasedAnalytics responses={responses} />;
}
```

### Solution 3: Graceful Session Completion (P1 - Important)

**Goal**: Mark sessions as completed even if user abandons

**Option A**: Auto-complete after inactivity (30 min timeout)
**Option B**: Complete session when user has X responses and leaves page
**Option C**: Show prominent "End Session" button after summary

**Recommended**: Option B - Browser beforeunload handler

**File Changes**: `src/components/employee/ChatInterface.tsx`

```typescript
// NEW: Auto-complete on page unload if responses exist
useEffect(() => {
  const handleBeforeUnload = async () => {
    if (userMessageCount >= 3 && !isPreviewMode && conversationId) {
      // Mark session as completed on page close
      await supabase
        .from('conversation_sessions')
        .update({ 
          status: 'completed', 
          ended_at: new Date().toISOString() 
        })
        .eq('id', conversationId);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [userMessageCount, conversationId, isPreviewMode]);
```

### Solution 4: Clarify Data Model in UI (P2 - Nice to Have)

**Goal**: Show HR both "sessions" (people) and "responses" (answers)

**New Metrics to Display**:
```text
┌─────────────────────────────────────────────┐
│  Sessions: 2 started, 0 completed           │
│  Responses: 8 answers recorded              │
│  Themes Covered: 4 of 4                     │
└─────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Immediate Fix (1 hour)
1. Update `useAnalytics.ts` to count from `conversation_sessions` for surveys with public links
2. Add `responseCount` to participation metrics
3. Update `HybridInsightsView` to show data when responses exist (even without completed sessions)

### Phase 2: UX Improvements (2 hours)
1. Add `beforeunload` handler to auto-complete sessions with 3+ responses
2. Make "Complete Session" button more prominent in SummaryReceipt
3. Add visual indicator showing "Session will be saved automatically"

### Phase 3: Data Model Clarity (Optional)
1. Add "Active Sessions" vs "Completed Sessions" breakdown in analytics
2. Show response count alongside session count
3. Consider renaming UI elements for clarity

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/hooks/useAnalytics.ts` | Hybrid participation counting from sessions | P0 |
| `src/components/hr/analytics/HybridInsightsView.tsx` | Show response-based analytics when no completions | P0 |
| `src/components/employee/ChatInterface.tsx` | Add beforeunload auto-complete | P1 |
| `src/components/employee/SummaryReceipt.tsx` | Make completion button more prominent | P1 |
| `src/components/hr/analytics/PulseSummary.tsx` | Show both sessions and responses | P2 |

---

## Database Verification

Your current data state:
```sql
-- Survey: Due Diligence of new ventures 26
-- survey_id: 1b314621-0840-4a73-8209-e498896a92c2

Sessions:  2 (both status='active', ended_at=NULL)
Responses: 8 (properly saved with content, sentiment, theme_id)
Evaluations: 0 (Spradley eval not triggered because sessions not completed)
```

**After implementing Phase 1**, the analytics would show:
- 2 sessions started (instead of 0)
- 8 responses recorded (new metric)
- Theme insights from actual response content (already working)

---

## Testing Checklist

- [ ] Analytics shows session count from `conversation_sessions`
- [ ] Response count is displayed even when sessions are "active"
- [ ] Theme insights populate from response data
- [ ] Auto-complete triggers when user closes browser after 3+ responses
- [ ] Manual "Complete Session" still works correctly

