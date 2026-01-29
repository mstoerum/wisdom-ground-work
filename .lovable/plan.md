
# Fix: Restore Survey Selection in Analytics Tab

## Problem Identified

The survey selector dropdown is not appearing because:

1. **Your current account** (`sebdackus@gmail.com`) only has the `employee` role
2. **Not the `hr_admin` role** needed to view all surveys in the analytics dashboard
3. The RLS policy correctly blocks employees from seeing surveys they haven't been assigned to

## Root Cause

This is an **account permissions issue**, not a code bug. The code is working correctly - the Select dropdown is hidden when `surveys.length === 0`:

```tsx
{surveys && surveys.length > 0 && (
  <Select ...>
```

## Solution Options

### Option A: Quick Fix - Add hr_admin Role (Recommended)
Add the `hr_admin` role to your current account so you can access the analytics features.

**Database change needed:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('7f531441-8730-4814-b978-1ac8c13bc340', 'hr_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Option B: Login with Existing HR Admin Account
The surveys were created by user `ddf2dad0-46e8-43ad-9d93-03142ae05943`. If you have access to that account, logging in with it will show all surveys.

### Option C: UI Improvement - Show Empty State
Instead of hiding the dropdown when no surveys are accessible, show a message explaining why no surveys appear.

**Changes to `src/pages/hr/Analytics.tsx`:**

| Line | Change |
|------|--------|
| 186-204 | Replace conditional rendering with always-visible selector + empty state message |

## Recommended Implementation

I recommend **Option A** (database migration) to grant your account the `hr_admin` role. This is the simplest fix and restores full functionality.

After that, you'll be able to:
- See all surveys in the dropdown
- Access analytics for any survey
- Create new surveys without RLS errors

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| Database migration | CREATE | Grant `hr_admin` role to your user account |

## Estimated Effort

1 credit - Single database migration to add the role.
