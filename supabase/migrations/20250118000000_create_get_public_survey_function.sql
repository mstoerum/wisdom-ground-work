-- Create a function to get public survey data by link token
-- This function uses SECURITY DEFINER to bypass RLS and properly evaluate the relationship
CREATE OR REPLACE FUNCTION get_public_survey_by_token(link_token_param text)
RETURNS TABLE (
  -- Link fields
  link_id uuid,
  link_survey_id uuid,
  link_token text,
  link_is_active boolean,
  link_max_responses integer,
  link_current_responses integer,
  link_expires_at timestamp with time zone,
  link_created_by uuid,
  link_created_at timestamp with time zone,
  -- Survey fields
  survey_id uuid,
  survey_title text,
  survey_description text,
  survey_first_message text,
  survey_consent_config jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psl.id as link_id,
    psl.survey_id as link_survey_id,
    psl.link_token as link_token,
    psl.is_active as link_is_active,
    psl.max_responses as link_max_responses,
    psl.current_responses as link_current_responses,
    psl.expires_at as link_expires_at,
    psl.created_by as link_created_by,
    psl.created_at as link_created_at,
    s.id as survey_id,
    s.title as survey_title,
    s.description as survey_description,
    s.first_message as survey_first_message,
    s.consent_config as survey_consent_config
  FROM public_survey_links psl
  INNER JOIN surveys s ON s.id = psl.survey_id
  WHERE psl.link_token = link_token_param
    AND psl.is_active = true
    AND (psl.expires_at IS NULL OR psl.expires_at > now())
    AND (psl.max_responses IS NULL OR psl.current_responses < psl.max_responses);
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_public_survey_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION get_public_survey_by_token(text) TO authenticated;
