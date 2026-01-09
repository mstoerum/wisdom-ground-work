-- DEMO MODE: Temporary anonymous read access for analytics showcase
-- TODO: Remove these policies before production

-- surveys: allow anonymous read
CREATE POLICY "demo_anon_read_surveys" ON public.surveys
  FOR SELECT TO anon USING (true);

-- survey_assignments: allow anonymous read  
CREATE POLICY "demo_anon_read_survey_assignments" ON public.survey_assignments
  FOR SELECT TO anon USING (true);

-- responses: allow anonymous read
CREATE POLICY "demo_anon_read_responses" ON public.responses
  FOR SELECT TO anon USING (true);

-- conversation_sessions: allow anonymous read
CREATE POLICY "demo_anon_read_conversation_sessions" ON public.conversation_sessions
  FOR SELECT TO anon USING (true);

-- survey_themes: allow anonymous read
CREATE POLICY "demo_anon_read_survey_themes" ON public.survey_themes
  FOR SELECT TO anon USING (true);

-- escalation_log: allow anonymous read
CREATE POLICY "demo_anon_read_escalation_log" ON public.escalation_log
  FOR SELECT TO anon USING (true);

-- narrative_reports: allow anonymous read
CREATE POLICY "demo_anon_read_narrative_reports" ON public.narrative_reports
  FOR SELECT TO anon USING (true);

-- theme_analytics: allow anonymous read
CREATE POLICY "demo_anon_read_theme_analytics" ON public.theme_analytics
  FOR SELECT TO anon USING (true);