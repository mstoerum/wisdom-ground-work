

## Public Analytics Sharing for HR

**Goal**: Allow HR admins to generate a shareable link for a specific survey's analytics page, so stakeholders without accounts can view the dashboard in read-only mode.

### Architecture

Similar to the existing `public_survey_links` pattern, we'll create:

1. **New DB table**: `public_analytics_links` — stores share tokens tied to a survey, with expiry and creator info
2. **New Edge Function**: `get-public-analytics` — fetches analytics data for a valid token (no auth required)
3. **New public page**: `/analytics/:shareToken` — renders the `HybridInsightsView` in read-only mode
4. **Share UI in HR Analytics page**: Button to generate/copy a shareable link

### Database

```sql
CREATE TABLE public.public_analytics_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.public_analytics_links ENABLE ROW LEVEL SECURITY;

-- HR admins manage links
CREATE POLICY "HR admins manage analytics links"
  ON public.public_analytics_links FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'hr_admin'));

-- Anon can read active links (to validate tokens)
CREATE POLICY "Public can validate analytics links"
  ON public.public_analytics_links FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
```

### Edge Function: `get-public-analytics`

- Accepts `{ shareToken }` in the request body
- Validates the token against `public_analytics_links` (active, not expired)
- Fetches participation, sentiment, theme data for the linked survey using service role
- Returns the analytics payload (no auth required, `verify_jwt = false`)

### Frontend Changes

1. **`src/pages/PublicAnalytics.tsx`** — New public page at `/analytics/:shareToken`
   - Calls the `get-public-analytics` edge function
   - Renders `HybridInsightsView` in a minimal layout (no HRLayout/sidebar)
   - Shows survey title, "Shared Analytics" badge, read-only mode

2. **`src/pages/hr/Analytics.tsx`** — Add share button
   - "Share" button next to the survey selector (only when a survey is selected)
   - On click: creates a `public_analytics_links` row with a generated token, shows a dialog with the copyable URL
   - Reuses the existing `PublicLinkDetails`-style dialog pattern

3. **`src/App.tsx`** — Add route: `<Route path="/analytics/:shareToken" element={<PublicAnalytics />} />`

### Technical Details

- Share tokens: random 12-char alphanumeric strings (generated client-side with `crypto.randomUUID()`)
- The edge function uses the service role key to bypass RLS and fetch analytics data
- The public page is completely standalone — no auth, no sidebar, minimal header
- HR admin can deactivate links from the analytics page

