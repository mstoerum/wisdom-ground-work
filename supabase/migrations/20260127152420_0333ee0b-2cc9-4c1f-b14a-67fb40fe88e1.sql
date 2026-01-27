-- Create response_signals table for per-response semantic extraction
CREATE TABLE public.response_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.responses(id) ON DELETE CASCADE NOT NULL,
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  signal_text text NOT NULL,
  dimension text NOT NULL CHECK (dimension IN ('expertise', 'autonomy', 'justice', 'social_connection', 'social_status')),
  facet text,
  intensity integer CHECK (intensity >= 1 AND intensity <= 10),
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_response_signals_survey_id ON public.response_signals(survey_id);
CREATE INDEX idx_response_signals_dimension ON public.response_signals(dimension);
CREATE INDEX idx_response_signals_response_id ON public.response_signals(response_id);

-- Enable RLS
ALTER TABLE public.response_signals ENABLE ROW LEVEL SECURITY;

-- RLS policy: HR roles can read signals
CREATE POLICY "HR access to response signals"
ON public.response_signals
FOR SELECT
USING (
  has_role(auth.uid(), 'hr_admin'::app_role) OR 
  has_role(auth.uid(), 'hr_analyst'::app_role)
);

-- RLS policy: Allow insert from edge functions (service role)
CREATE POLICY "Service role insert signals"
ON public.response_signals
FOR INSERT
WITH CHECK (true);

-- Create aggregated_signals table for survey-level patterns
CREATE TABLE public.aggregated_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  signal_text text NOT NULL,
  dimension text NOT NULL CHECK (dimension IN ('expertise', 'autonomy', 'justice', 'social_connection', 'social_status')),
  facet text,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  voice_count integer DEFAULT 0,
  agreement_pct integer CHECK (agreement_pct >= 0 AND agreement_pct <= 100),
  avg_intensity numeric(3,1),
  evidence_ids uuid[] DEFAULT '{}',
  analyzed_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_aggregated_signals_survey_id ON public.aggregated_signals(survey_id);
CREATE INDEX idx_aggregated_signals_dimension ON public.aggregated_signals(dimension);

-- Enable RLS
ALTER TABLE public.aggregated_signals ENABLE ROW LEVEL SECURITY;

-- RLS policy: HR roles can read aggregated signals
CREATE POLICY "HR access to aggregated signals"
ON public.aggregated_signals
FOR SELECT
USING (
  has_role(auth.uid(), 'hr_admin'::app_role) OR 
  has_role(auth.uid(), 'hr_analyst'::app_role)
);

-- RLS policy: HR admins can manage aggregated signals
CREATE POLICY "HR admin manage aggregated signals"
ON public.aggregated_signals
FOR ALL
USING (has_role(auth.uid(), 'hr_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr_admin'::app_role));

-- RLS policy: Allow insert/update from edge functions (service role)
CREATE POLICY "Service role manage aggregated signals"
ON public.aggregated_signals
FOR ALL
WITH CHECK (true);