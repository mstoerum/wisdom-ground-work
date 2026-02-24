

# Fix: Survey Save Fails With "Not authenticated"

## Root Cause

The error is clear from console logs: `"Not authenticated"` thrown at `CreateSurvey.tsx:178`.

The `ProtectedRoute` component is in **demo mode** — it lets everyone through without requiring login. But `CreateSurvey.tsx` line 138-140 calls `supabase.auth.getUser()` and throws when there's no real session:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

Similarly, `useUserRole.ts` returns hardcoded roles without checking auth. So the UI appears to work, but any database operation fails because there's no authenticated user — and Supabase RLS policies on the `surveys` table require `hr_admin` role.

## The Fix

Restore real authentication checking in `ProtectedRoute.tsx` and `useUserRole.ts` so users must log in before accessing HR pages. This ensures `supabase.auth.getUser()` returns a valid user when saving surveys.

### File 1: `src/components/ProtectedRoute.tsx`
- Remove demo bypass
- Add real session checking via `supabase.auth.getSession()`
- Redirect to `/auth` if no session exists
- Show loading state while checking

### File 2: `src/hooks/useUserRole.ts`
- Remove hardcoded demo roles
- Fetch actual roles from the `user_roles` table using `supabase.auth.getUser()` and querying `user_roles`
- Return real `isHRAdmin`, `isEmployee`, `isHRAnalyst` based on database data

## What You Need To Do

After this fix is deployed, you will need to:
1. Navigate to `/auth` and sign in (or create an account)
2. If this is the first account, you'll be redirected to `/admin-bootstrap` to claim the HR admin role
3. Then you can create surveys normally

## Files Changed

| File | Change |
|------|--------|
| `src/components/ProtectedRoute.tsx` | Restore real auth session checking, redirect to `/auth` if not logged in |
| `src/hooks/useUserRole.ts` | Fetch real roles from `user_roles` table instead of returning hardcoded values |

