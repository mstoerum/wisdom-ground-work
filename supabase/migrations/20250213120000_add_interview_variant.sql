-- Add interview variant to surveys table for A/B testing
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS interview_variant TEXT
  DEFAULT 'standard'
  CHECK (interview_variant IN ('standard', 'time_boxed'));

-- Track duration selection and theme preference per conversation session
ALTER TABLE conversation_sessions ADD COLUMN IF NOT EXISTS selected_duration INTEGER;
ALTER TABLE conversation_sessions ADD COLUMN IF NOT EXISTS selected_theme_id TEXT;
