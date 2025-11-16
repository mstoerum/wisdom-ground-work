# Deployment Checklist - Spradley Evaluation Feature

## Pre-Deployment Fixes Applied ✅

### Critical Fixes
1. ✅ **Database Column Name**: Fixed to use `conversation_session_id` (correct column per migration)
2. ✅ **Sentiment Storage**: Added sentiment data storage from edge function response
3. ✅ **Zero Division Protection**: Added guards for empty evaluation arrays

### Code Improvements
4. ✅ **Error Handling**: Improved error handling in edge function
5. ✅ **Dependency Arrays**: Fixed React hook dependencies
6. ✅ **Empty State Handling**: Added proper empty state handling

---

## Deployment Steps

### 1. Database Migration
```bash
# Apply the migration
supabase migration up

# Verify migration applied
supabase db diff
```

**Migration File**: `supabase/migrations/20251116101016_add_spradley_evaluation.sql`

**What it creates**:
- `spradley_evaluations` table
- RLS policies
- Indexes for performance

### 2. Edge Function Deployment
```bash
# Deploy the evaluation edge function
supabase functions deploy evaluate-spradley

# Verify deployment
supabase functions list
```

**Function**: `supabase/functions/evaluate-spradley/index.ts`

**Environment Variables Required**:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `LOVABLE_API_KEY` (must be set manually)

### 3. Frontend Deployment
```bash
# Build the frontend
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

**Files Changed**:
- `src/components/employee/SpradleyEvaluation.tsx`
- `src/components/employee/EmployeeSurveyFlow.tsx`
- `src/pages/hr/SpradleyEvaluations.tsx`
- `src/components/hr/evaluations/*` (new components)
- `src/App.tsx` (route added)
- `src/components/hr/HRLayout.tsx` (menu item added)

---

## Post-Deployment Verification

### Test Checklist

#### Survey Creation
- [ ] Create a new survey
- [ ] Check "Request Spradley Evaluation" checkbox
- [ ] Verify checkbox state saves correctly
- [ ] Edit draft survey and verify checkbox state loads

#### Survey Completion Flow
- [ ] Complete a survey with evaluation enabled
- [ ] Verify evaluation step appears after survey completion
- [ ] Verify evaluation does NOT appear in preview mode
- [ ] Verify evaluation does NOT appear if checkbox unchecked

#### Evaluation Flow
- [ ] Introduction message displays correctly
- [ ] Can send messages to evaluation AI
- [ ] Progress indicator updates correctly
- [ ] Time limit countdown works
- [ ] Skip button works
- [ ] Auto-completion after 4-5 questions works
- [ ] Time limit auto-completion works (2.5 minutes)

#### Data Storage
- [ ] Evaluation saves to database
- [ ] Sentiment data is stored
- [ ] Structured data in `key_insights` is correct
- [ ] Duration is tracked accurately
- [ ] Timestamps are correct

#### HR Dashboard
- [ ] Navigate to "Spradley Evaluations" menu item
- [ ] Page loads without errors
- [ ] Metrics display correctly
- [ ] Tabs navigate properly
- [ ] Charts render (if data exists)
- [ ] Empty state displays when no evaluations
- [ ] Individual responses view works
- [ ] Trends view works
- [ ] Insights extraction works

#### Error Scenarios
- [ ] Network failure during evaluation (graceful error)
- [ ] API timeout (graceful error)
- [ ] Invalid survey ID (proper error message)
- [ ] Missing conversation session (handles gracefully)

---

## Monitoring

### Key Metrics to Monitor

1. **Evaluation Completion Rate**
   - Target: >80%
   - Monitor: % of users who complete evaluation vs skip

2. **Average Duration**
   - Expected: 60-120 seconds
   - Monitor: If too high, evaluation may be too long

3. **Sentiment Distribution**
   - Monitor: Ratio of positive/neutral/negative
   - Alert: If negative sentiment >30%

4. **Error Rate**
   - Monitor: Edge function errors
   - Alert: If error rate >5%

5. **Response Quality**
   - Monitor: Average response length
   - Monitor: Empty or very short responses

### Logs to Check

1. **Edge Function Logs**
   ```bash
   supabase functions logs evaluate-spradley
   ```

2. **Database Errors**
   - Check Supabase dashboard for RLS policy violations
   - Check for constraint violations

3. **Frontend Errors**
   - Check browser console for errors
   - Check network tab for failed requests

---

## Rollback Plan

If issues occur:

### 1. Disable Feature
- Set `enable_spradley_evaluation` default to `false` in schema
- Or hide checkbox in UI temporarily

### 2. Rollback Edge Function
```bash
# Deploy previous version
supabase functions deploy evaluate-spradley --version <previous-version>
```

### 3. Rollback Frontend
- Revert to previous git commit
- Redeploy frontend

### 4. Database Rollback
```bash
# Rollback migration (if needed)
supabase migration down
```

**Note**: This will delete all evaluation data. Only do this if absolutely necessary.

---

## Success Criteria

Feature is successful if:
- ✅ Evaluation completion rate >80%
- ✅ No critical errors in logs
- ✅ HR admins can view insights
- ✅ Sentiment data is being captured
- ✅ Users find evaluation valuable (qualitative feedback)

---

## Support & Troubleshooting

### Common Issues

1. **Evaluation not appearing**
   - Check: `enable_spradley_evaluation` is `true` in survey
   - Check: User is not in preview mode
   - Check: Conversation session exists

2. **Edge function errors**
   - Check: Environment variables set correctly
   - Check: API key is valid
   - Check: Database permissions

3. **Data not saving**
   - Check: RLS policies allow insert
   - Check: User is authenticated
   - Check: Database connection

4. **Dashboard not loading**
   - Check: RLS policies allow select
   - Check: User has HR admin role
   - Check: Database query syntax

---

## Documentation

All documentation is in:
- `SPRADLEY_EVALUATION_EXPERT_REVIEW.md` - Expert recommendations
- `EVALUATION_IMPROVEMENTS_SUMMARY.md` - Phase 1 improvements
- `PHASE2_EVALUATION_DASHBOARD_COMPLETE.md` - Phase 2 implementation
- `PRE_DEPLOYMENT_REVIEW.md` - Comprehensive review
- `DEPLOYMENT_CHECKLIST.md` - This file

---

## Sign-Off

**Code Review**: ✅ Complete
**Fixes Applied**: ✅ Complete
**Testing**: ⏳ Ready for testing
**Deployment**: ✅ Ready

**Status**: 🟢 **READY FOR DEPLOYMENT**

**Next Steps**:
1. Run test checklist
2. Deploy to staging (if available)
3. Test in staging
4. Deploy to production
5. Monitor metrics
