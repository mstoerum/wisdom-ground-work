
CREATE TABLE public.public_analytics_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.public_analytics_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins manage analytics links"
  ON public.public_analytics_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'hr_admin'));

CREATE POLICY "Public can validate analytics links"
  ON public.public_analytics_links FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
