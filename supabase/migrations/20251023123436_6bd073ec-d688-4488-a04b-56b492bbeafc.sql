-- Fix search_path for all database functions to prevent SQL injection

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update assign_initial_hr_admin function
CREATE OR REPLACE FUNCTION public.assign_initial_hr_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Update has_role function (already has search_path but recreating for consistency)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Update log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action_type text,
  _resource_type text DEFAULT NULL,
  _resource_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    metadata,
    timestamp
  ) VALUES (
    auth.uid(),
    _action_type,
    _resource_type,
    _resource_id,
    _metadata,
    now()
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$function$;

-- Update has_any_admin function
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'hr_admin'
  )
$function$;

-- Update auto_assign_employee_role function
CREATE OR REPLACE FUNCTION public.auto_assign_employee_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;