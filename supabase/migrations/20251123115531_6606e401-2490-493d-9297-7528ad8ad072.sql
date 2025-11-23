-- Create spradley_evaluations table for storing evaluation feedback
CREATE TABLE IF NOT EXISTS public.spradley_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  conversation_session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous evaluations
  evaluation_responses JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_sentiment TEXT,
  sentiment_score NUMERIC(5,2),
  key_insights JSONB,
  duration_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spradley_evaluations ENABLE ROW LEVEL SECURITY;

-- HR can view all evaluations
CREATE POLICY "HR access to spradley evaluations"
ON public.spradley_evaluations
FOR SELECT
USING (
  has_role(auth.uid(), 'hr_admin'::app_role) OR 
  has_role(auth.uid(), 'hr_analyst'::app_role)
);

-- Authenticated employees can insert their own evaluations
CREATE POLICY "Employees can insert own evaluations"
ON public.spradley_evaluations
FOR INSERT
WITH CHECK (
  auth.uid() = employee_id
);

-- Anonymous users can insert evaluations for public surveys
CREATE POLICY "Anonymous users can insert evaluations for public surveys"
ON public.spradley_evaluations
FOR INSERT
WITH CHECK (
  -- Allow if there's a public_link_id on the conversation session
  EXISTS (
    SELECT 1
    FROM conversation_sessions cs
    WHERE cs.id = spradley_evaluations.conversation_session_id
      AND cs.public_link_id IS NOT NULL
  )
);

-- Create index for performance
CREATE INDEX idx_spradley_evaluations_survey ON public.spradley_evaluations(survey_id);
CREATE INDEX idx_spradley_evaluations_session ON public.spradley_evaluations(conversation_session_id);