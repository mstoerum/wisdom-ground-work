-- Disable the trigger temporarily so we can update sessions
ALTER TABLE public.conversation_sessions DISABLE TRIGGER on_session_completed;