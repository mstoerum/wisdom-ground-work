-- Add RLS policy to allow HR admins to insert conversation sessions for demo/testing
CREATE POLICY "HR admins can insert sessions for demo"
ON public.conversation_sessions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'hr_admin'));

-- Add RLS policy to allow HR admins to insert responses for demo/testing
CREATE POLICY "HR admins can insert responses for demo"
ON public.responses
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'hr_admin'));