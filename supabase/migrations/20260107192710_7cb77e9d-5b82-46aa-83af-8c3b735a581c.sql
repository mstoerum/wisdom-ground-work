-- Update trigger_session_analysis to also call analyze-theme for automatic theme analysis
CREATE OR REPLACE FUNCTION public.trigger_session_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Call analyze-session edge function (existing behavior)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-session',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('session_id', NEW.id::text)
    );
    
    -- Also call analyze-theme edge function for survey-level theme insights
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-theme',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('survey_id', NEW.survey_id::text)
    );
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;