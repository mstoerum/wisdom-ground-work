
-- Create bookmarked_insights table for HR users to star insights
CREATE TABLE public.bookmarked_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_category TEXT,
  agreement_percentage NUMERIC,
  chapter_key TEXT,
  bookmarked_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookmarked_insights ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.bookmarked_insights FOR SELECT
TO authenticated
USING (auth.uid() = bookmarked_by);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON public.bookmarked_insights FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = bookmarked_by);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.bookmarked_insights FOR DELETE
TO authenticated
USING (auth.uid() = bookmarked_by);

-- Index for fast lookups
CREATE INDEX idx_bookmarked_insights_survey_user ON public.bookmarked_insights(survey_id, bookmarked_by);
