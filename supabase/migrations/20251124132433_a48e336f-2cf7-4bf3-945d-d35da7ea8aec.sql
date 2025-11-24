-- Create spradley_analytics table for LLM-generated insights
CREATE TABLE public.spradley_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  executive_summary TEXT,
  top_insights JSONB DEFAULT '[]'::jsonb,
  feature_feedback JSONB DEFAULT '{}'::jsonb,
  usability_issues JSONB DEFAULT '[]'::jsonb,
  feature_requests JSONB DEFAULT '[]'::jsonb,
  competitive_analysis TEXT,
  sentiment_trends JSONB DEFAULT '{}'::jsonb,
  actionable_recommendations JSONB DEFAULT '[]'::jsonb,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_evaluations_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spradley_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for HR roles
CREATE POLICY "HR access to spradley analytics"
ON public.spradley_analytics
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_admin') OR has_role(auth.uid(), 'hr_analyst'));

-- Indexes for performance
CREATE INDEX idx_spradley_analytics_survey_id ON public.spradley_analytics(survey_id);
CREATE INDEX idx_spradley_analytics_analyzed_at ON public.spradley_analytics(analyzed_at DESC);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.spradley_analytics;