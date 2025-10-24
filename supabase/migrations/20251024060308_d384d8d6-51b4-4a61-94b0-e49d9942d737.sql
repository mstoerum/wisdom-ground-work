-- Create table for public survey links
CREATE TABLE public.public_survey_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  link_token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  max_responses integer NULL,
  current_responses integer DEFAULT 0,
  expires_at timestamp with time zone NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add index for fast token lookup
CREATE INDEX idx_public_survey_links_token ON public.public_survey_links(link_token);

-- Enable RLS
ALTER TABLE public.public_survey_links ENABLE ROW LEVEL SECURITY;

-- HR admins can manage all public links
CREATE POLICY "HR admins full control of public links"
ON public.public_survey_links
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Public read access for valid tokens (used by edge function)
CREATE POLICY "Public can view active links"
ON public.public_survey_links
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add trigger for updated_at
CREATE TRIGGER update_public_survey_links_updated_at
BEFORE UPDATE ON public.public_survey_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();