-- Fix RLS policy for public survey access
-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Public can view surveys via active links" ON public.surveys;

-- Create the policy to allow anonymous users to read surveys that have active public links
CREATE POLICY "Public can view surveys via active links"
ON public.surveys FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 
    FROM public.public_survey_links
    WHERE public_survey_links.survey_id = surveys.id
    AND public_survey_links.is_active = true
    AND (public_survey_links.expires_at IS NULL OR public_survey_links.expires_at > now())
  )
);

-- Ensure RLS is enabled on surveys table
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
