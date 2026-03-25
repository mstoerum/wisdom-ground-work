-- Re-enable trigger but rewrite function to be a no-op (edge functions will be called manually)
-- The net.http_post schema doesn't exist in Lovable Cloud
CREATE OR REPLACE FUNCTION public.trigger_session_analysis()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Note: In Lovable Cloud, net.http_post is not available.
  -- Session analysis (analyze-session, analyze-theme) should be triggered 
  -- manually via edge function calls or from the client side.
  -- This trigger is kept as a placeholder for future webhook integration.
  RETURN NEW;
END;
$function$;

ALTER TABLE public.conversation_sessions ENABLE TRIGGER on_session_completed;