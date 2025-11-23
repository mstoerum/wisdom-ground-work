-- Create survey_analytics table for survey-wide deep analysis
CREATE TABLE IF NOT EXISTS public.survey_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  executive_summary TEXT,
  top_themes JSONB DEFAULT '[]'::jsonb,
  sentiment_trends JSONB DEFAULT '{}'::jsonb,
  cultural_insights TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  strategic_recommendations JSONB DEFAULT '[]'::jsonb,
  participation_analysis TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_sessions_analyzed INTEGER DEFAULT 0,
  UNIQUE(survey_id, analyzed_at)
);

-- Create index for faster lookups
CREATE INDEX idx_survey_analytics_survey_id ON public.survey_analytics(survey_id);
CREATE INDEX idx_survey_analytics_analyzed_at ON public.survey_analytics(analyzed_at DESC);

-- Enable RLS
ALTER TABLE public.survey_analytics ENABLE ROW LEVEL SECURITY;

-- HR can view and manage all analytics
CREATE POLICY "HR access to survey analytics"
  ON public.survey_analytics
  FOR ALL
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role) OR 
    has_role(auth.uid(), 'hr_analyst'::app_role)
  );