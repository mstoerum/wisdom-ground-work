-- Create table to track rate limiting for public survey links
CREATE TABLE IF NOT EXISTS public.public_link_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES public.public_survey_links(id) ON DELETE CASCADE NOT NULL,
  ip_address text NOT NULL,
  session_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(link_id, ip_address, window_start)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_link_ip ON public.public_link_rate_limits(link_id, ip_address, window_start DESC);

-- Enable RLS
ALTER TABLE public.public_link_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert rate limit records
CREATE POLICY "Anonymous users can insert rate limits"
ON public.public_link_rate_limits
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to read rate limits (for checking)
CREATE POLICY "Anonymous users can read rate limits"
ON public.public_link_rate_limits
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to update rate limits
CREATE POLICY "Anonymous users can update rate limits"
ON public.public_link_rate_limits
FOR UPDATE
TO anon
USING (true);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  link_id_param uuid,
  ip_address_param text,
  max_sessions_per_hour integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window_start timestamp with time zone;
  current_count integer;
BEGIN
  -- Get the start of the current hour window
  current_window_start := date_trunc('hour', now());
  
  -- Check if there's a record for this link/IP in the current hour
  SELECT session_count INTO current_count
  FROM public_link_rate_limits
  WHERE link_id = link_id_param
    AND ip_address = ip_address_param
    AND window_start = current_window_start;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO public_link_rate_limits (link_id, ip_address, session_count, window_start)
    VALUES (link_id_param, ip_address_param, 1, current_window_start)
    ON CONFLICT (link_id, ip_address, window_start) DO UPDATE
    SET session_count = public_link_rate_limits.session_count + 1,
        updated_at = now();
    RETURN true;
  END IF;
  
  -- If count exceeds limit, return false
  IF current_count >= max_sessions_per_hour THEN
    RETURN false;
  END IF;
  
  -- Increment count
  UPDATE public_link_rate_limits
  SET session_count = session_count + 1,
      updated_at = now()
  WHERE link_id = link_id_param
    AND ip_address = ip_address_param
    AND window_start = current_window_start;
  
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, integer) TO anon;
GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, integer) TO authenticated;

-- Cleanup function to remove old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public_link_rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO authenticated;
