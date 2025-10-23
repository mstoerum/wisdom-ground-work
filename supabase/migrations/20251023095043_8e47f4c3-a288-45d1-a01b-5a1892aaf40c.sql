-- Add is_active column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Create index for active profiles
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create function to check if any admin exists
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'hr_admin'
  )
$$;

-- Create trigger function to auto-assign employee role and create profile
CREATE OR REPLACE FUNCTION public.auto_assign_employee_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert employee role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create profile entry
  INSERT INTO public.profiles (id, email, full_name, department, is_active)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    department = COALESCE(EXCLUDED.department, profiles.department);
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_employee_role();

-- Update RLS policies to check is_active status
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id AND is_active = true);

DROP POLICY IF EXISTS "HR admins can view all profiles" ON public.profiles;
CREATE POLICY "HR admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin'::app_role) OR has_role(auth.uid(), 'hr_analyst'::app_role));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND is_active = true);

-- Add policy for HR admins to update profiles (including is_active)
CREATE POLICY "HR admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'hr_admin'::app_role));