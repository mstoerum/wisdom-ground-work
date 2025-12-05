-- Fix privilege escalation vulnerability in assign_demo_hr_admin function
-- Only allow users with @demo.spradley.ai email domain to self-assign HR admin role

CREATE OR REPLACE FUNCTION public.assign_demo_hr_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email of the calling user
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Only allow demo users (emails ending in @demo.spradley.ai)
  IF user_email IS NULL OR user_email NOT LIKE '%@demo.spradley.ai' THEN
    RAISE EXCEPTION 'Not authorized: only demo users can use this function';
  END IF;
  
  -- Assign the HR admin role to the demo user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'hr_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;