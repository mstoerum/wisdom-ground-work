
-- ============================================================
-- Analytics Pipeline v2 — Phase 1: Opinion Units + Pipeline Runs
-- ============================================================

-- Opinion Units: atomic meaning fragments extracted from each response
CREATE TABLE IF NOT EXISTS opinion_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  text TEXT NOT NULL,
  aspect TEXT NOT NULL,
  sentiment REAL CHECK (sentiment BETWEEN -1.0 AND 1.0),
  intensity REAL CHECK (intensity BETWEEN 0.0 AND 1.0),
  is_actionable BOOLEAN DEFAULT false,
  escalation_level TEXT DEFAULT 'none' CHECK (escalation_level IN ('none', 'flag', 'urgent')),
  escalation_reason TEXT,
  
  cluster_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_opinion_units_response ON opinion_units(response_id);
CREATE INDEX idx_opinion_units_session ON opinion_units(session_id);
CREATE INDEX idx_opinion_units_survey ON opinion_units(survey_id);
CREATE INDEX idx_opinion_units_aspect ON opinion_units(aspect);

-- Pipeline Runs: track pipeline progress per survey
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  extraction_completed_at TIMESTAMPTZ,
  synthesis_completed_at TIMESTAMPTZ,
  clustering_completed_at TIMESTAMPTZ,
  interpretation_completed_at TIMESTAMPTZ,
  report_generated_at TIMESTAMPTZ,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'extracting', 'synthesizing', 'clustering', 
    'interpreting', 'ready', 'report_generated', 'failed'
  )),
  error_message TEXT,
  
  auto_trigger BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(survey_id)
);

CREATE INDEX idx_pipeline_runs_survey ON pipeline_runs(survey_id);

-- Add signals_extracted tracking to responses
ALTER TABLE responses 
  ADD COLUMN IF NOT EXISTS signals_extracted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS opinion_unit_count INTEGER DEFAULT 0;

-- RLS for opinion_units
ALTER TABLE opinion_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR access to opinion units" ON opinion_units
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'hr_admin'::app_role) OR has_role(auth.uid(), 'hr_analyst'::app_role));

CREATE POLICY "Service role insert opinion units" ON opinion_units
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Service role delete opinion units" ON opinion_units
  FOR DELETE TO public
  USING (true);

-- RLS for pipeline_runs
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR access to pipeline runs" ON pipeline_runs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'hr_admin'::app_role) OR has_role(auth.uid(), 'hr_analyst'::app_role));

CREATE POLICY "Service role manage pipeline runs" ON pipeline_runs
  FOR ALL TO public
  WITH CHECK (true);
