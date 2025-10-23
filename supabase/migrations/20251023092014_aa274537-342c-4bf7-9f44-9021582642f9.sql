-- Fix security definer view warning
-- Drop the view and recreate without security definer
DROP VIEW IF EXISTS public.anonymized_responses;

CREATE VIEW public.anonymized_responses 
WITH (security_invoker=true) AS
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

GRANT SELECT ON public.anonymized_responses TO authenticated;