-- Create function to assign HR admin role for demo mode
-- This function always assigns the role to the current user, regardless of whether other admins exist
-- Intended for use in demo mode where users need temporary admin access

CREATE OR REPLACE FUNCTION public.assign_demo_hr_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign the current user as HR admin (for demo purposes)
  -- This bypasses the check in assign_initial_hr_admin that only works if no admin exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'hr_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.assign_demo_hr_admin() IS 
  'Assigns HR admin role to the current user for demo mode. Always assigns the role regardless of whether other admins exist. Uses SECURITY DEFINER to bypass RLS policies.';
