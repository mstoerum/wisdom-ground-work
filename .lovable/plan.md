
# Fix Plan: Survey Creation Issues

## Problem Summary

Two issues are preventing survey creation:

1. **Survey type selection appears broken** - Clicking on "Employee Satisfaction" or "Course Evaluation" cards doesn't show visual selection feedback
2. **Save Draft and Deploy fail silently** - No authentication session exists, so database writes fail

---

## Root Cause Analysis

### Issue 1: Visual Selection Feedback Not Working

The `SurveyTypeSelector` component uses Tailwind's `peer` CSS pattern to style cards when their associated radio button is selected. However, the DOM structure breaks this pattern:

```text
Current structure (BROKEN):
FormItem
  ├── FormControl
  │     └── RadioGroupItem (peer, sr-only) 
  └── FormLabel
        └── Card (peer-data-[state=checked]:...)
```

The `peer-data-[state=checked]` selector requires the `RadioGroupItem` to be a direct sibling, but it's wrapped in `FormControl` while the `Card` is inside `FormLabel`.

**Note**: The selection actually WORKS functionally - the form value updates correctly. Only the visual feedback (border highlight) is broken.

### Issue 2: Authentication Not Active

The codebase has `ProtectedRoute` and `useUserRole` in **demo mode**, which bypasses authentication checks. However, the `saveDraft` function in `CreateSurvey.tsx` still requires a real authenticated user:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');  // This fails!
```

Since no actual Supabase session exists, all database writes fail.

---

## Solution

### Fix 1: Update SurveyTypeSelector DOM Structure

Restructure the component so the `RadioGroupItem` is a direct sibling of the styled `Card`:

**File: `src/components/hr/wizard/SurveyTypeSelector.tsx`**

Change from wrapping in `FormItem` to a simpler structure where the hidden radio and visible card label are direct siblings:

```tsx
<RadioGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="relative">
    <RadioGroupItem 
      value="employee_satisfaction" 
      id="employee_satisfaction" 
      className="peer sr-only" 
    />
    <label htmlFor="employee_satisfaction" className="cursor-pointer block">
      <Card className="peer-data-[state=checked]:border-primary ...">
        {/* Card content */}
      </Card>
    </label>
  </div>
  {/* Same for course_evaluation */}
</RadioGroup>
```

**Alternative approach**: Use React state to track selection and apply styles conditionally instead of relying on CSS peer selectors:

```tsx
const selectedType = field.value;

<Card className={cn(
  "transition-all hover:border-primary/50",
  selectedType === 'employee_satisfaction' && "border-primary ring-2 ring-primary/20"
)}>
```

### Fix 2: Restore Real Authentication

The demo mode bypasses need to be removed to enable actual authentication:

**File: `src/hooks/useUserRole.ts`**
- Remove hardcoded demo roles
- Restore actual Supabase role fetching from `user_roles` table

**File: `src/components/ProtectedRoute.tsx`**
- Remove demo bypass
- Restore actual session checking with redirect to `/auth`

This ensures users must sign in before accessing protected routes like `/hr/create-survey`.

---

## Files to Modify

| File | Change | Purpose |
|------|--------|---------|
| `src/components/hr/wizard/SurveyTypeSelector.tsx` | Fix DOM structure or use state-based styling | Enable visual selection feedback |
| `src/hooks/useUserRole.ts` | Remove demo mode, restore Supabase role fetching | Enable real role checking |
| `src/components/ProtectedRoute.tsx` | Remove demo bypass, restore auth checking | Require login for protected routes |

---

## Implementation Order

1. **Fix authentication first** - This is the primary blocker for save/deploy functionality
2. **Fix visual selection** - Secondary UX issue

---

## Estimated Effort

- Authentication restoration: 2-3 credits
- Survey type selector fix: 1 credit
- **Total: 3-4 credits**

---

## What This Fixes

After implementation:
- Users must sign in to access HR dashboard
- Survey type cards show visual selection when clicked
- Save Draft button successfully saves to database
- Deploy button successfully creates survey and assignments

