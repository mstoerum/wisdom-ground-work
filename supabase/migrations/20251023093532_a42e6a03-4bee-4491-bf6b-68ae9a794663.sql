-- Create survey_updates table for HR-to-employee communications
CREATE TABLE IF NOT EXISTS public.survey_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on survey_updates
ALTER TABLE public.survey_updates ENABLE ROW LEVEL SECURITY;

-- HR admins can manage survey updates
CREATE POLICY "HR admins manage survey updates"
ON public.survey_updates
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Employees can view updates for surveys they participated in
CREATE POLICY "Employees view updates for their surveys"
ON public.survey_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM survey_assignments sa
    WHERE sa.survey_id = survey_updates.survey_id
    AND sa.employee_id = auth.uid()
    AND sa.status = 'completed'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_updates_survey_id ON public.survey_updates(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_updates_published_at ON public.survey_updates(published_at DESC);