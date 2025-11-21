-- Drop the view temporarily
DROP VIEW IF EXISTS anonymized_responses;

-- Alter sentiment_score column to support 0-100 scale
ALTER TABLE responses ALTER COLUMN sentiment_score TYPE NUMERIC(5,2);

-- Recreate the anonymized_responses view
CREATE OR REPLACE VIEW anonymized_responses AS
SELECT 
  r.id,
  r.conversation_session_id,
  r.survey_id,
  r.theme_id,
  r.content,
  r.ai_response,
  r.sentiment,
  r.sentiment_score,
  r.ai_analysis,
  r.urgency_escalated,
  r.is_paraphrased,
  r.created_at,
  cs.employee_id
FROM responses r
LEFT JOIN conversation_sessions cs ON cs.id = r.conversation_session_id
WHERE cs.anonymization_level = 'anonymous';

-- Add comment for clarity
COMMENT ON COLUMN responses.sentiment_score IS 'Sentiment score on 0-100 scale where 0=very negative, 50=neutral, 100=very positive';