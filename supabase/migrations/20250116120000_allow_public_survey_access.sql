-- Allow anonymous users to read surveys that are linked via active public_survey_links
-- This is needed for the public survey link feature to work
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
