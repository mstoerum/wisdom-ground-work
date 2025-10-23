-- Fix 1: Add resolution tracking to escalation_log
ALTER TABLE public.escalation_log 
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.escalation_log.resolved_by IS 'User who marked the flag as resolved';

-- Fix 2: Create survey_defaults table for organization-wide settings
CREATE TABLE IF NOT EXISTS public.survey_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid DEFAULT gen_random_uuid(), -- For multi-tenant future
  consent_message text NOT NULL DEFAULT 'Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.',
  anonymization_level text NOT NULL DEFAULT 'anonymous' CHECK (anonymization_level IN ('identified', 'anonymous', 'pseudonymous')),
  first_message text NOT NULL DEFAULT 'Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.',
  data_retention_days integer NOT NULL DEFAULT 60,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS on survey_defaults
ALTER TABLE public.survey_defaults ENABLE ROW LEVEL SECURITY;

-- HR admins can manage defaults
CREATE POLICY "HR admins manage survey defaults"
ON public.survey_defaults
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'));

-- HR analysts can view defaults
CREATE POLICY "HR analysts view survey defaults"
ON public.survey_defaults
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin') OR has_role(auth.uid(), 'hr_analyst'));

-- Create trigger for updated_at
CREATE TRIGGER update_survey_defaults_updated_at
BEFORE UPDATE ON public.survey_defaults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix 3: Update has_role function to explicitly set search_path (fixes security warning)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$function$;