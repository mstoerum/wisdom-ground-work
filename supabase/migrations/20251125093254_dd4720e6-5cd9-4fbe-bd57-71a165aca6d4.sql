-- Create narrative_reports table for storing AI-generated story reports
CREATE TABLE public.narrative_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID NOT NULL,
  report_version INTEGER NOT NULL DEFAULT 1,
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  audience_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score INTEGER,
  is_latest BOOLEAN NOT NULL DEFAULT true
);

-- Create index for efficient retrieval
CREATE INDEX idx_narrative_reports_survey_id ON public.narrative_reports(survey_id);
CREATE INDEX idx_narrative_reports_is_latest ON public.narrative_reports(is_latest);
CREATE INDEX idx_narrative_reports_generated_at ON public.narrative_reports(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.narrative_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: HR admins and analysts can view all narrative reports
CREATE POLICY "HR access to narrative reports"
ON public.narrative_reports
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'hr_admin'::app_role) OR 
  has_role(auth.uid(), 'hr_analyst'::app_role)
);