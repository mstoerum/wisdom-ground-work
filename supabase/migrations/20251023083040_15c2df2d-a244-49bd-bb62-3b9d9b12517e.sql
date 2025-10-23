-- Fix conversation_sessions table schema
ALTER TABLE conversation_sessions 
DROP COLUMN IF EXISTS anonymous_token_hash,
DROP COLUMN IF EXISTS mood_selection;

ALTER TABLE conversation_sessions
ADD COLUMN IF NOT EXISTS anonymous_token_id uuid REFERENCES anonymous_tokens(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS initial_mood integer,
ADD COLUMN IF NOT EXISTS final_mood integer;

-- Fix responses table schema
ALTER TABLE responses
DROP COLUMN IF EXISTS session_id,
DROP COLUMN IF EXISTS message_text,
DROP COLUMN IF EXISTS original_text;

ALTER TABLE responses
ADD COLUMN IF NOT EXISTS conversation_session_id uuid REFERENCES conversation_sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_response text;

-- Update responses policies
DROP POLICY IF EXISTS "System can insert responses" ON responses;
CREATE POLICY "Employees can insert own responses"
ON responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = conversation_session_id
    AND cs.employee_id = auth.uid()
  )
);

-- Fix anonymous_tokens RLS
DROP POLICY IF EXISTS "No direct access to tokens" ON anonymous_tokens;
CREATE POLICY "Employees can view own tokens"
ON anonymous_tokens FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Employees can create own tokens"
ON anonymous_tokens FOR INSERT
WITH CHECK (employee_id = auth.uid());