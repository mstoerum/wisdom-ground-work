-- Theme Analytics table for AI-powered granular theme analysis
CREATE TABLE public.theme_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.survey_themes(id) ON DELETE CASCADE,
  
  -- Theme Health Index (THI) - 0-100 scale
  health_index INTEGER NOT NULL CHECK (health_index >= 0 AND health_index <= 100),
  health_status TEXT NOT NULL CHECK (health_status IN ('thriving', 'stable', 'emerging', 'friction', 'critical')),
  
  -- Intensity + Direction scores
  intensity_score NUMERIC(4,3) NOT NULL CHECK (intensity_score >= 0 AND intensity_score <= 1),
  direction_score NUMERIC(4,3) NOT NULL CHECK (direction_score >= -1 AND direction_score <= 1),
  
  -- Polarization detection
  polarization_level TEXT NOT NULL CHECK (polarization_level IN ('low', 'medium', 'high')),
  polarization_score NUMERIC(4,3) CHECK (polarization_score >= 0 AND polarization_score <= 1),
  
  -- AI-generated semantic insights
  insights JSONB NOT NULL DEFAULT '{"frictions": [], "strengths": [], "patterns": []}',
  
  -- Root causes identified by AI
  root_causes JSONB DEFAULT '[]',
  
  -- Confidence and metadata
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 5),
  response_count INTEGER NOT NULL DEFAULT 0,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint per survey+theme
  UNIQUE(survey_id, theme_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_theme_analytics_survey ON public.theme_analytics(survey_id);
CREATE INDEX idx_theme_analytics_theme ON public.theme_analytics(theme_id);
CREATE INDEX idx_theme_analytics_health ON public.theme_analytics(health_index);
CREATE INDEX idx_theme_analytics_status ON public.theme_analytics(health_status);

-- Enable RLS
ALTER TABLE public.theme_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies: HR admins and analysts can read/write theme analytics
CREATE POLICY "HR admins can manage theme analytics"
  ON public.theme_analytics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_admin', 'hr_analyst')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_admin', 'hr_analyst')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.theme_analytics IS 'Stores AI-powered theme analysis results with granular health scoring, polarization detection, and semantic insights';