-- Add urgency_score column to responses table
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS urgency_score INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN public.responses.urgency_score IS 'LLM-extracted urgency level (1-5): 1=low, 5=critical';

-- Add index for fast filtering by urgency
CREATE INDEX IF NOT EXISTS idx_responses_urgency_score 
ON public.responses(urgency_score DESC) 
WHERE urgency_score IS NOT NULL;

-- Add composite index for common query patterns (survey + urgency)
CREATE INDEX IF NOT EXISTS idx_responses_survey_urgency 
ON public.responses(survey_id, urgency_score DESC) 
WHERE urgency_score IS NOT NULL;