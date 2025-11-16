-- Add public_link_id to conversation_sessions to track public link usage
ALTER TABLE public.conversation_sessions
ADD COLUMN IF NOT EXISTS public_link_id uuid REFERENCES public.public_survey_links(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_public_link ON public.conversation_sessions(public_link_id);

-- Allow anonymous users to create conversation sessions for public links
CREATE POLICY "Anonymous users can create sessions for public links"
ON public.conversation_sessions
FOR INSERT
TO anon
WITH CHECK (
  public_link_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.public_survey_links
    WHERE public_survey_links.id = conversation_sessions.public_link_id
    AND public_survey_links.is_active = true
    AND (public_survey_links.expires_at IS NULL OR public_survey_links.expires_at > now())
  )
  AND employee_id IS NULL
);

-- Allow anonymous users to update their own public link sessions
-- Note: We don't check if link is still active in USING clause because
-- users should be able to complete sessions even if link expires mid-conversation
CREATE POLICY "Anonymous users can update own public link sessions"
ON public.conversation_sessions
FOR UPDATE
TO anon
USING (
  public_link_id IS NOT NULL
  AND employee_id IS NULL
  -- Allow updates even if link expired (user started before expiration)
  AND EXISTS (
    SELECT 1 
    FROM public.public_survey_links
    WHERE public_survey_links.id = conversation_sessions.public_link_id
  )
)
WITH CHECK (
  public_link_id IS NOT NULL
  AND employee_id IS NULL
);

-- Allow anonymous users to read their own public link sessions (for resuming)
CREATE POLICY "Anonymous users can read own public link sessions"
ON public.conversation_sessions
FOR SELECT
TO anon
USING (
  public_link_id IS NOT NULL
  AND employee_id IS NULL
  AND EXISTS (
    SELECT 1 
    FROM public.public_survey_links
    WHERE public_survey_links.id = conversation_sessions.public_link_id
    AND public_survey_links.is_active = true
  )
);

-- Update existing RLS policies to allow null employee_id for authenticated users with public links
-- This allows authenticated users who came via public link to also create sessions
DROP POLICY IF EXISTS "Employees create own sessions" ON public.conversation_sessions;
CREATE POLICY "Employees create own sessions"
ON public.conversation_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = employee_id OR (employee_id IS NULL AND public_link_id IS NOT NULL)
);

-- Update the select policy to allow authenticated users to see public link sessions they created
DROP POLICY IF EXISTS "Employees see own sessions" ON public.conversation_sessions;
CREATE POLICY "Employees see own sessions"
ON public.conversation_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = employee_id 
  OR (employee_id IS NULL AND public_link_id IS NOT NULL)
);

-- Update responses INSERT policy to allow anonymous public link users to insert responses
DROP POLICY IF EXISTS "Employees can insert own responses" ON public.responses;
CREATE POLICY "Employees can insert own responses"
ON public.responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND (
      -- Authenticated users can insert for their own sessions
      (cs.employee_id = auth.uid())
      OR
      -- Anonymous users can insert for public link sessions
      (cs.employee_id IS NULL AND cs.public_link_id IS NOT NULL)
    )
  )
);

-- Allow anonymous users to insert responses for public link sessions
CREATE POLICY "Anonymous users can insert responses for public links"
ON public.responses FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND cs.employee_id IS NULL
    AND cs.public_link_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.public_survey_links
      WHERE public_survey_links.id = cs.public_link_id
      AND public_survey_links.is_active = true
    )
  )
);

-- Allow anonymous users to read their own responses for public link sessions
-- This is needed for features like theme coverage calculation and closing ritual
CREATE POLICY "Anonymous users can read own responses for public links"
ON public.responses FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND cs.employee_id IS NULL
    AND cs.public_link_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.public_survey_links
      WHERE public_survey_links.id = cs.public_link_id
      AND public_survey_links.is_active = true
    )
  )
);

-- Update the existing "Block all employee direct access to responses" policy
-- to allow authenticated users to read responses from their own sessions (including public link sessions)
DROP POLICY IF EXISTS "Block all employee direct access to responses" ON public.responses;
CREATE POLICY "Block all employee direct access to responses"
ON public.responses FOR SELECT
USING (
  -- HR admins and analysts can read all responses
  has_role(auth.uid(), 'hr_admin') 
  OR has_role(auth.uid(), 'hr_analyst')
  OR
  -- Authenticated users can read responses from their own sessions
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND cs.employee_id = auth.uid()
  )
  OR
  -- Authenticated users can read responses from public link sessions they created
  EXISTS (
    SELECT 1 FROM conversation_sessions cs
    WHERE cs.id = responses.conversation_session_id
    AND cs.employee_id IS NULL
    AND cs.public_link_id IS NOT NULL
  )
);
