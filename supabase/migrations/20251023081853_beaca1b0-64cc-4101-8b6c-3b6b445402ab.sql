-- Fix search_path for the bootstrap function
DROP FUNCTION IF EXISTS public.assign_initial_hr_admin();

CREATE OR REPLACE FUNCTION public.assign_initial_hr_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if any HR admin already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'hr_admin'
  ) THEN
    -- Assign the current user as HR admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'hr_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;