-- Testing and Review Schema
-- Supports comprehensive testing of chat vs voice vs traditional surveys

-- Testing sessions table
CREATE TABLE IF NOT EXISTS public.testing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Participant info (anonymized)
  persona_id text NOT NULL, -- e.g., 'maria_chen', 'james_mitchell'
  organization_type text NOT NULL, -- 'large_corp', 'startup', 'ngo', 'public_sector'
  participant_code text NOT NULL, -- anonymized participant identifier
  
  -- Demographics (optional, for analysis)
  age_range text, -- '20-30', '31-40', etc.
  tech_comfort_level integer, -- 1-5 scale
  role_level text, -- 'individual_contributor', 'manager', 'executive'
  
  -- Test configuration
  test_sequence text[], -- order of methods tested: ['survey', 'chat', 'voice']
  environment text, -- 'office', 'home', 'mobile', 'field'
  
  -- Status
  status text DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  completed_at timestamp with time zone
);

-- Testing interactions table (one per method tested)
CREATE TABLE IF NOT EXISTS public.testing_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Link to session
  testing_session_id uuid REFERENCES public.testing_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Method tested
  method text NOT NULL, -- 'traditional_survey', 'chat', 'voice'
  
  -- Metrics
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration_seconds integer, -- calculated
  
  -- Engagement metrics
  message_count integer DEFAULT 0, -- for chat/voice
  word_count integer DEFAULT 0, -- total words from user
  interaction_count integer DEFAULT 0, -- turns/exchanges
  
  -- Completion
  completed boolean DEFAULT false,
  completion_percentage integer DEFAULT 0, -- 0-100
  
  -- Technical metrics
  error_count integer DEFAULT 0,
  technical_issues text[], -- array of issue descriptions
  device_type text, -- 'desktop', 'tablet', 'mobile'
  browser text,
  
  -- Quality metrics (calculated later)
  sentiment_score numeric(5,2), -- average sentiment
  emotion_detected text[], -- detected emotions
  
  -- Context
  location text, -- where they completed it
  time_of_day text, -- 'morning', 'afternoon', 'evening'
  
  -- Conversation reference (if applicable)
  conversation_session_id uuid REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  
  -- Survey reference (if traditional survey)
  survey_response_id uuid -- reference to survey response if applicable
);

-- Testing questionnaire responses
CREATE TABLE IF NOT EXISTS public.testing_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Link to session
  testing_session_id uuid REFERENCES public.testing_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Link to interaction (specific method)
  testing_interaction_id uuid REFERENCES public.testing_interactions(id) ON DELETE CASCADE,
  
  -- Questionnaire type
  questionnaire_type text NOT NULL, -- 'pre_interaction', 'post_interaction', 'comparison', 'final_reflection'
  method_tested text, -- which method this relates to
  
  -- Responses (stored as JSON for flexibility)
  responses jsonb NOT NULL, -- structured questionnaire responses
  
  -- Summary scores (calculated)
  ease_of_use_score integer, -- 1-5
  comfort_score integer, -- 1-5
  trust_score integer, -- 1-5
  privacy_confidence integer, -- 1-5
  engagement_score integer, -- 1-5
  overall_satisfaction integer -- 1-5
);

-- Testing observations (qualitative notes)
CREATE TABLE IF NOT EXISTS public.testing_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Link to session/interaction
  testing_session_id uuid REFERENCES public.testing_sessions(id) ON DELETE CASCADE NOT NULL,
  testing_interaction_id uuid REFERENCES public.testing_interactions(id) ON DELETE CASCADE,
  
  -- Observation details
  observer_id text, -- who made the observation
  observation_type text, -- 'user_behavior', 'technical_issue', 'emotional_response', 'barrier', 'delight'
  timestamp timestamp with time zone, -- when it occurred during session
  description text NOT NULL,
  category text, -- 'hesitation', 'confusion', 'error', 'positive_reaction', etc.
  severity text -- 'low', 'medium', 'high'
);

-- Testing comparisons (side-by-side analysis)
CREATE TABLE IF NOT EXISTS public.testing_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Link to session
  testing_session_id uuid REFERENCES public.testing_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Methods being compared
  method_a text NOT NULL, -- 'traditional_survey', 'chat', 'voice'
  method_b text NOT NULL,
  
  -- Comparison metrics
  preference text, -- which method preferred
  preference_reasoning text,
  
  -- Comparative scores (how A compares to B)
  time_comparison text, -- 'faster', 'slower', 'similar'
  depth_comparison text, -- 'deeper', 'shallower', 'similar'
  comfort_comparison text,
  honesty_comparison text,
  engagement_comparison text,
  
  -- Quantitative differences
  time_difference_seconds integer,
  word_count_difference integer,
  sentiment_difference numeric(5,2),
  
  -- Ranking
  method_rankings jsonb, -- ranked list: [{'method': 'voice', 'rank': 1, 'score': 8.5}, ...]
  
  -- Recommendation
  would_recommend boolean,
  recommendation_score integer -- 1-5 likelihood to recommend
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_testing_sessions_persona ON public.testing_sessions(persona_id);
CREATE INDEX IF NOT EXISTS idx_testing_sessions_org_type ON public.testing_sessions(organization_type);
CREATE INDEX IF NOT EXISTS idx_testing_sessions_status ON public.testing_sessions(status);
CREATE INDEX IF NOT EXISTS idx_testing_interactions_session ON public.testing_interactions(testing_session_id);
CREATE INDEX IF NOT EXISTS idx_testing_interactions_method ON public.testing_interactions(method);
CREATE INDEX IF NOT EXISTS idx_testing_questionnaires_session ON public.testing_questionnaires(testing_session_id);
CREATE INDEX IF NOT EXISTS idx_testing_observations_session ON public.testing_observations(testing_session_id);
CREATE INDEX IF NOT EXISTS idx_testing_comparisons_session ON public.testing_comparisons(testing_session_id);

-- RLS Policies
ALTER TABLE public.testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own test sessions
CREATE POLICY "Users can insert own test sessions"
  ON public.testing_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own test sessions"
  ON public.testing_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Allow HR admins to read all test data
CREATE POLICY "HR admins can read all test data"
  ON public.testing_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'hr_admin'
    )
  );

CREATE POLICY "HR admins can read all interactions"
  ON public.testing_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'hr_admin'
    )
  );

CREATE POLICY "Users can insert own interactions"
  ON public.testing_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can insert own questionnaires"
  ON public.testing_questionnaires FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can insert own observations"
  ON public.testing_observations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can insert own comparisons"
  ON public.testing_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate interaction duration
CREATE OR REPLACE FUNCTION calculate_interaction_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interaction_duration
  BEFORE INSERT OR UPDATE ON public.testing_interactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_interaction_duration();
