-- Phase 1: Add RLS policy for anonymous users to read public link sessions
-- This is the CRITICAL fix that allows anonymous users to check if they're using a public link

CREATE POLICY "Anonymous users can read public link sessions"
ON conversation_sessions
FOR SELECT
TO anon
USING (
  public_link_id IS NOT NULL
);