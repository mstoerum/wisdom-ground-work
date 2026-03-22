
DROP FUNCTION IF EXISTS public.get_public_survey_by_token(text);

CREATE FUNCTION public.get_public_survey_by_token(link_token_param text)
RETURNS TABLE(
  link_id uuid,
  link_survey_id uuid,
  link_token text,
  link_is_active boolean,
  link_max_responses integer,
  link_current_responses integer,
  link_expires_at timestamptz,
  link_created_by uuid,
  link_created_at timestamptz,
  survey_id uuid,
  survey_title text,
  survey_description text,
  survey_first_message text,
  survey_consent_config jsonb,
  survey_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    psl.id AS link_id,
    psl.survey_id AS link_survey_id,
    psl.link_token AS link_token,
    psl.is_active AS link_is_active,
    psl.max_responses AS link_max_responses,
    psl.current_responses AS link_current_responses,
    psl.expires_at AS link_expires_at,
    psl.created_by AS link_created_by,
    psl.created_at AS link_created_at,
    s.id AS survey_id,
    s.title AS survey_title,
    s.description AS survey_description,
    s.first_message AS survey_first_message,
    s.consent_config AS survey_consent_config,
    s.survey_type::text AS survey_type
  FROM public.public_survey_links psl
  JOIN public.surveys s ON s.id = psl.survey_id
  WHERE psl.link_token = link_token_param
    AND psl.is_active = true;
END;
$$;
