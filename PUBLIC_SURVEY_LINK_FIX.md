# Public Survey Link Error Fix

## Problem
When trying to deploy a survey with a shareable link, users encounter the error:
```
Survey Unavailable
Survey data not available. Please contact the survey administrator.
```

## Root Cause
The issue is caused by Row Level Security (RLS) policies on the `surveys` table. When an anonymous user (not authenticated) tries to access a survey through a public link, the database query successfully finds the `public_survey_links` record but fails to join with the `surveys` table because the RLS policy blocking anonymous access isn't properly configured.

### Technical Details
- The `PublicSurvey.tsx` component queries the `public_survey_links` table and joins it with the `surveys` table
- Anonymous users (role: `anon`) can read from `public_survey_links` due to existing RLS policy
- However, the RLS policy on `surveys` table that should allow anonymous users to view surveys via active public links was either missing or not properly applied

## Solution
I've created a migration file that fixes the RLS policy:
- **File**: `/workspace/supabase/migrations/20251116120000_fix_public_survey_rls.sql`

This migration:
1. Drops the existing policy (if it exists)
2. Creates a new policy that allows anonymous users to SELECT from `surveys` table if there's an active, non-expired `public_survey_links` record for that survey
3. Ensures RLS is enabled on the `surveys` table

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're linked to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration to your database
npx supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/workspace/supabase/migrations/20251116120000_fix_public_survey_rls.sql`
4. Execute the SQL

### Option 3: Using Direct SQL
Run this SQL directly in your Supabase SQL editor:

```sql
-- Fix RLS policy for public survey access
DROP POLICY IF EXISTS "Public can view surveys via active links" ON public.surveys;

CREATE POLICY "Public can view surveys via active links"
ON public.surveys FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 
    FROM public.public_survey_links
    WHERE public_survey_links.survey_id = surveys.id
    AND public_survey_links.is_active = true
    AND (public_survey_links.expires_at IS NULL OR public_survey_links.expires_at > now())
  )
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
```

## Testing the Fix

After applying the migration:

1. **Create a new survey with public link targeting**:
   - Go to Create Survey
   - Set target type to "Public Link"
   - Complete the survey setup
   - Deploy the survey

2. **Test the public link**:
   - Copy the generated public survey link
   - Open it in an incognito/private browser window (to simulate anonymous user)
   - You should see the survey landing page with title, description, and signup form
   - The "Survey Unavailable" error should no longer appear

3. **Verify in Database** (optional):
   - Check that the policy exists: 
     ```sql
     SELECT * FROM pg_policies WHERE tablename = 'surveys' AND policyname = 'Public can view surveys via active links';
     ```

## Related Files
- Frontend: `/workspace/src/pages/PublicSurvey.tsx` (lines 20-42)
- Edge Function: `/workspace/supabase/functions/deploy-survey/index.ts` (lines 103-131)
- RLS Policy Migration: `/workspace/supabase/migrations/20251116120000_fix_public_survey_rls.sql`

## Prevention
To prevent this issue in the future:
- Always test public survey links in an incognito window after deployment
- Verify RLS policies are working correctly when adding new tables or modifying authentication flows
- Include RLS policy checks in your deployment checklist
