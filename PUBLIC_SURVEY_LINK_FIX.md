# Public Survey Link RLS Fix

## Problem

When accessing a public survey link (e.g., `/survey/feewef`), users were getting the error:
```
Survey Unavailable
Survey data not available. Please contact the survey administrator.
```

## Root Cause

The issue was caused by **Row Level Security (RLS) policy evaluation** when querying the `surveys` table separately from the `public_survey_links` table. 

The original code:
1. First queried `public_survey_links` to get link info (✅ worked)
2. Then separately queried `surveys` table using the `survey_id` (❌ failed due to RLS)

Even though there was an RLS policy allowing anonymous users to read surveys with active public links, Supabase couldn't properly evaluate the relationship when the queries were done separately.

## Solution

Created a **database function** (`get_public_survey_by_token`) that:
- Uses `SECURITY DEFINER` to bypass RLS issues
- Joins `public_survey_links` and `surveys` tables in a single query
- Validates all conditions (active, not expired, under max responses)
- Returns both link and survey data together

This ensures the relationship is properly evaluated and the data is accessible to anonymous users.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20250118000000_create_get_public_survey_function.sql`
- Creates `get_public_survey_by_token()` function
- Grants execute permission to `anon` and `authenticated` roles

### 2. Frontend Code
**File:** `src/pages/PublicSurvey.tsx`
- Changed from separate queries to RPC function call
- Improved error handling and logging
- Better error messages for debugging

## Next Steps

1. **Apply the migration** to your database:
   ```bash
   # If using Supabase CLI
   supabase db push
   
   # Or apply manually via Supabase dashboard SQL editor
   ```

2. **Test the fix**:
   - Try accessing your public link: `/survey/feewef`
   - Should now load the survey successfully

3. **Verify**:
   - Link validation works (expired links, max responses)
   - Survey data loads correctly
   - Anonymous users can complete surveys

## Technical Details

### Why RPC Function Works

The RPC function uses `SECURITY DEFINER`, which means:
- It runs with the privileges of the function creator (typically a superuser)
- It can bypass RLS policies while still enforcing business logic
- The join query properly evaluates the relationship between tables
- All validation happens in one place (database level)

### Function Signature

```sql
get_public_survey_by_token(link_token_param text)
RETURNS TABLE (
  link_id uuid,
  link_survey_id uuid,
  link_token text,
  -- ... other link fields
  survey_id uuid,
  survey_title text,
  -- ... other survey fields
)
```

### Usage in Frontend

```typescript
const { data: result } = await supabase.rpc(
  "get_public_survey_by_token",
  { link_token_param: linkToken }
);
```

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Public link with valid token loads survey
- [ ] Expired link shows appropriate error
- [ ] Link at max responses shows appropriate error
- [ ] Inactive link shows appropriate error
- [ ] Invalid token shows appropriate error
- [ ] Anonymous user can complete survey
- [ ] Responses are saved correctly

## Related Files

- `src/pages/PublicSurvey.tsx` - Public survey page component
- `supabase/migrations/20250118000000_create_get_public_survey_function.sql` - Database function
- `supabase/migrations/20251116120000_fix_public_survey_rls.sql` - RLS policy (existing)
- `supabase/migrations/20250116120000_allow_public_survey_access.sql` - RLS policy (existing)
