
CREATE TABLE public.discovered_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  pipeline_run_id uuid REFERENCES pipeline_runs(id),
  cluster_label text NOT NULL,
  cluster_summary text,
  opinion_unit_ids uuid[] DEFAULT '{}',
  unit_count integer DEFAULT 0,
  avg_sentiment numeric,
  sentiment_spread numeric,
  escalation_count integer DEFAULT 0,
  representative_quotes jsonb DEFAULT '[]',
  related_theme_id uuid REFERENCES survey_themes(id),
  is_emerging boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.discovered_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR access to discovered clusters"
  ON public.discovered_clusters FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'hr_admin') OR has_role(auth.uid(), 'hr_analyst'));

CREATE POLICY "Service role manage discovered clusters"
  ON public.discovered_clusters FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service role delete discovered clusters"
  ON public.discovered_clusters FOR DELETE
  TO public
  USING (true);
