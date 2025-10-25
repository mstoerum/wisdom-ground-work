-- Create employee invitations table
CREATE TABLE public.employee_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  department TEXT,
  full_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- HR admins can manage all invitations
CREATE POLICY "HR admins full control of invitations"
ON public.employee_invitations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_admin'::app_role));

-- Create index for faster token lookups
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(invitation_token);
CREATE INDEX idx_employee_invitations_status ON public.employee_invitations(status);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_invitations_updated_at
BEFORE UPDATE ON public.employee_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();