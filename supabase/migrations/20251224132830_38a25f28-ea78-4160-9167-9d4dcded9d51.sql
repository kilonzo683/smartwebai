-- Create invitations table for proper invite workflow
CREATE TABLE public.organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'end_user',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations
CREATE POLICY "Org admins can manage invitations"
ON public.organization_invitations
FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_invitations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('org_admin', 'super_admin')
  )) OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Invited user can view their invitation"
ON public.organization_invitations
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_invitations_org ON public.organization_invitations(organization_id);

-- Update audit_log to add more action types and ensure proper tracking
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS entity_name text,
ADD COLUMN IF NOT EXISTS old_values jsonb,
ADD COLUMN IF NOT EXISTS new_values jsonb;