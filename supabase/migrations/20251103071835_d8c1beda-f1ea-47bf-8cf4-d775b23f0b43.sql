-- Function to assign HR admin role for demo users
-- Unlike assign_initial_hr_admin, this works even if other admins exist
-- This is specifically for demo/testing purposes
CREATE OR REPLACE FUNCTION public.assign_demo_hr_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign the current user as HR admin (for demo purposes)
  -- This bypasses the RLS policy that only allows HR admins to insert roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'hr_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_demo_hr_admin() TO authenticated;