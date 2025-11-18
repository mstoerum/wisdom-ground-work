-- Add public_link_id to conversation_sessions to track public link usage
ALTER TABLE public.conversation_sessions
ADD COLUMN IF NOT EXISTS public_link_id uuid REFERENCES public.public_survey_links(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_public_link ON public.conversation_sessions(public_link_id);

-- Allow anonymous users to create conversation sessions for public links
CREATE POLICY "Anonymous users can create sessions for public links"
ON public.conversation_sessions
FOR INSERT
WITH CHECK (public_link_id IS NOT NULL);

-- Allow anonymous users to read their own sessions via public link
CREATE POLICY "Anonymous users can read sessions for public links"
ON public.conversation_sessions
FOR SELECT
USING (public_link_id IS NOT NULL);

-- Allow anonymous users to update their own sessions via public link
CREATE POLICY "Anonymous users can update sessions for public links"
ON public.conversation_sessions
FOR UPDATE
USING (public_link_id IS NOT NULL);

-- Allow anonymous users to insert responses for public link sessions
CREATE POLICY "Anonymous users can insert responses for public links"
ON public.responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND cs.public_link_id IS NOT NULL
  )
);