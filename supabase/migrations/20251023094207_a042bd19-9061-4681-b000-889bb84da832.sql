-- Sprint 6: Security, Compliance & Production Readiness - Database Setup

-- =====================================================
-- 1. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- 2. CONSENT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.consent_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  consent_given_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_revoked_at TIMESTAMPTZ,
  anonymization_level TEXT NOT NULL DEFAULT 'anonymous',
  data_retention_days INTEGER NOT NULL DEFAULT 60,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_consent_history_user_id ON public.consent_history(user_id);
CREATE INDEX idx_consent_history_survey_id ON public.consent_history(survey_id);

ALTER TABLE public.consent_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent history"
ON public.consent_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent"
ON public.consent_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent (revoke)"
ON public.consent_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "HR admins can view all consent history"
ON public.consent_history
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- 3. DATA RETENTION LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.data_retention_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES public.surveys(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  records_deleted_count INTEGER NOT NULL DEFAULT 0,
  retention_policy_days INTEGER NOT NULL,
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  execution_type TEXT NOT NULL DEFAULT 'automatic',
  details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_retention_log_survey_id ON public.data_retention_log(survey_id);
CREATE INDEX idx_retention_log_deleted_at ON public.data_retention_log(deleted_at DESC);

ALTER TABLE public.data_retention_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins can view retention logs"
ON public.data_retention_log
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin'));

-- =====================================================
-- 4. ENHANCED RLS POLICIES
-- =====================================================

-- Ensure employees can never directly access responses table
DROP POLICY IF EXISTS "No direct employee access to responses" ON public.responses;
CREATE POLICY "Block all employee direct access to responses"
ON public.responses
FOR ALL
USING (
  has_role(auth.uid(), 'hr_admin') 
  OR has_role(auth.uid(), 'hr_analyst')
);

-- Ensure survey_updates can only be created/modified by HR admins
DROP POLICY IF EXISTS "HR admins manage survey updates" ON public.survey_updates;
CREATE POLICY "HR admins full control of survey updates"
ON public.survey_updates
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'));

-- Ensure action_commitments visibility is strictly controlled
DROP POLICY IF EXISTS "HR manage commitments" ON public.action_commitments;
DROP POLICY IF EXISTS "Employees view visible commitments" ON public.action_commitments;

CREATE POLICY "HR admins full control of commitments"
ON public.action_commitments
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Employees view only visible commitments"
ON public.action_commitments
FOR SELECT
USING (visible_to_employees = true);

-- =====================================================
-- 5. DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Add check constraints for data integrity
ALTER TABLE public.responses 
DROP CONSTRAINT IF EXISTS check_sentiment_values;

ALTER TABLE public.responses 
ADD CONSTRAINT check_sentiment_values 
CHECK (sentiment IN ('positive', 'neutral', 'negative') OR sentiment IS NULL);

ALTER TABLE public.conversation_sessions
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE public.conversation_sessions
ADD CONSTRAINT check_status_values
CHECK (status IN ('active', 'completed', 'abandoned'));

ALTER TABLE public.conversation_sessions
DROP CONSTRAINT IF EXISTS check_anonymization_level;

ALTER TABLE public.conversation_sessions
ADD CONSTRAINT check_anonymization_level
CHECK (anonymization_level IN ('anonymous', 'partial', 'identified'));

ALTER TABLE public.surveys
DROP CONSTRAINT IF EXISTS check_survey_status;

ALTER TABLE public.surveys
ADD CONSTRAINT check_survey_status
CHECK (status IN ('draft', 'active', 'completed', 'archived'));

-- =====================================================
-- 6. HELPER FUNCTION FOR AUDIT LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action_type TEXT,
  _resource_type TEXT DEFAULT NULL,
  _resource_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;