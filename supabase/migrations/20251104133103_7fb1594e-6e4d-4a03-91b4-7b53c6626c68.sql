-- Add DELETE policies for HR admins on conversation_sessions and responses tables
-- This allows MockDataGenerator to properly clean up old demo data

-- Add DELETE policy for conversation_sessions
CREATE POLICY "HR admins can delete sessions"
ON public.conversation_sessions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Add DELETE policy for responses
CREATE POLICY "HR admins can delete responses"
ON public.responses
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'hr_admin'::app_role));