-- ============================================
-- Sprint 4B: Security Hardening & Feature Implementation
-- ============================================

-- Part 1: Security Fixes
-- ============================================

-- 1.1 Fix Survey Themes RLS Policies
-- Drop existing permissive policy
DROP POLICY IF EXISTS "Everyone can view active themes" ON public.survey_themes;

-- HR roles can view all active themes
CREATE POLICY "HR roles view all themes"
ON public.survey_themes
FOR SELECT
USING (
  is_active = true 
  AND (
    has_role(auth.uid(), 'hr_admin'::app_role) 
    OR has_role(auth.uid(), 'hr_analyst'::app_role)
  )
);

-- Employees can view themes for their assigned surveys
CREATE POLICY "Employees view assigned survey themes"
ON public.survey_themes
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM survey_assignments sa
    JOIN surveys s ON s.id = sa.survey_id
    WHERE sa.employee_id = auth.uid()
    AND s.themes ? survey_themes.id::text
  )
);

-- 1.2 Create Anonymized Responses View
-- This view respects anonymization levels and hides employee_id when needed
CREATE OR REPLACE VIEW public.anonymized_responses AS
SELECT 
  r.id,
  r.conversation_session_id,
  r.survey_id,
  r.theme_id,
  r.content,
  r.ai_response,
  r.sentiment,
  r.sentiment_score,
  r.urgency_escalated,
  r.is_paraphrased,
  r.ai_analysis,
  r.created_at,
  -- Only show employee_id if survey is NOT anonymous
  CASE 
    WHEN cs.anonymization_level = 'anonymous' THEN NULL
    ELSE cs.employee_id
  END as employee_id
FROM public.responses r
LEFT JOIN public.conversation_sessions cs ON cs.id = r.conversation_session_id;

-- Grant access to authenticated users
GRANT SELECT ON public.anonymized_responses TO authenticated;

-- Part 2: Enable Role Management
-- ============================================

-- Update user_roles RLS to allow HR admins to manage roles
CREATE POLICY "HR admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'hr_admin'::app_role));

CREATE POLICY "HR admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Part 3: Add indexes for performance
-- ============================================

-- Index for theme detection queries
CREATE INDEX IF NOT EXISTS idx_responses_theme_id ON public.responses(theme_id);

-- Index for urgency queries
CREATE INDEX IF NOT EXISTS idx_responses_urgency ON public.responses(urgency_escalated) 
WHERE urgency_escalated = true;

-- Index for escalation log queries
CREATE INDEX IF NOT EXISTS idx_escalation_resolved ON public.escalation_log(resolved_at);

-- Index for conversation sessions by survey
CREATE INDEX IF NOT EXISTS idx_sessions_survey ON public.conversation_sessions(survey_id);