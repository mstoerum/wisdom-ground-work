-- Create function to increment link response counter
CREATE OR REPLACE FUNCTION increment_link_responses(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.public_survey_links
  SET current_responses = current_responses + 1
  WHERE id = link_id;
END;
$$;