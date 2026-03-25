
-- Remove broken trigger on public_survey_links (table has no updated_at column)
DROP TRIGGER IF EXISTS update_public_survey_links_updated_at ON public_survey_links;

-- Disable session completion trigger temporarily  
ALTER TABLE conversation_sessions DISABLE TRIGGER on_session_completed;

-- Mark sessions with 3+ responses as completed
UPDATE conversation_sessions 
SET status = 'completed', ended_at = COALESCE(ended_at, (
  SELECT MAX(r.created_at) FROM responses r WHERE r.conversation_session_id = conversation_sessions.id
))
WHERE survey_id = 'f92618e1-cc2f-466f-8d46-d92893cd9ada'
AND status = 'active'
AND id IN (
  SELECT cs.id FROM conversation_sessions cs 
  JOIN responses r ON r.conversation_session_id = cs.id 
  WHERE cs.survey_id = 'f92618e1-cc2f-466f-8d46-d92893cd9ada'
  GROUP BY cs.id HAVING COUNT(r.id) >= 3
);

-- Re-enable trigger
ALTER TABLE conversation_sessions ENABLE TRIGGER on_session_completed;

-- Fix public link counter
UPDATE public_survey_links 
SET current_responses = 30
WHERE survey_id = 'f92618e1-cc2f-466f-8d46-d92893cd9ada';
