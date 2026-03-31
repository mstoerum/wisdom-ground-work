
CREATE TABLE public.session_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  narrative_summary text NOT NULL,
  emotional_arc jsonb DEFAULT '[]'::jsonb,
  themes_explored jsonb DEFAULT '[]'::jsonb,
  key_quotes jsonb DEFAULT '[]'::jsonb,
  root_causes jsonb DEFAULT '[]'::jsonb,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  engagement_quality jsonb DEFAULT '{}'::jsonb,
  escalation_summary jsonb DEFAULT '{}'::jsonb,
  sentiment_trajectory text DEFAULT 'stable',
  confidence_score integer,
  opinion_units_analyzed integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR access to session syntheses"
  ON public.session_syntheses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'hr_admin'::app_role) OR has_role(auth.uid(), 'hr_analyst'::app_role));

CREATE POLICY "Service role manage session syntheses"
  ON public.session_syntheses FOR INSERT
  TO public
  WITH CHECK (true);
