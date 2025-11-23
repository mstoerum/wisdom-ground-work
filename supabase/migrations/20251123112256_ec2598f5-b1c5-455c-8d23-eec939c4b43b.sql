-- Create session_insights table for per-session batch analysis
CREATE TABLE IF NOT EXISTS public.session_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  root_cause TEXT,
  sentiment_trajectory TEXT CHECK (sentiment_trajectory IN ('improving', 'declining', 'stable', 'mixed')),
  key_quotes JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id)
);

-- Create index for faster lookups
CREATE INDEX idx_session_insights_session_id ON public.session_insights(session_id);
CREATE INDEX idx_session_insights_created_at ON public.session_insights(created_at DESC);

-- Enable RLS
ALTER TABLE public.session_insights ENABLE ROW LEVEL SECURITY;

-- HR can view all insights
CREATE POLICY "HR access to session insights"
  ON public.session_insights
  FOR ALL
  USING (
    has_role(auth.uid(), 'hr_admin'::app_role) OR 
    has_role(auth.uid(), 'hr_analyst'::app_role)
  );

-- Create function to trigger session analysis
CREATE OR REPLACE FUNCTION public.trigger_session_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Call edge function asynchronously using pg_net extension
    -- This requires pg_net extension to be enabled
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-session',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('session_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on conversation_sessions
CREATE TRIGGER on_session_completed
  AFTER UPDATE ON public.conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_session_analysis();