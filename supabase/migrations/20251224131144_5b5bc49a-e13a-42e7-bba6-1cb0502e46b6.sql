-- Add sentiment and confidence columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS confidence_score numeric,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_escalated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_reason text,
ADD COLUMN IF NOT EXISTS resolution_notes text,
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS customer_satisfaction integer;

-- Create support_resolutions table to track resolved issues for learning
CREATE TABLE IF NOT EXISTS public.support_resolutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.escalation_tickets(id) ON DELETE SET NULL,
  issue_summary text NOT NULL,
  resolution_summary text NOT NULL,
  resolution_steps jsonb DEFAULT '[]',
  was_escalated boolean DEFAULT false,
  resolution_time_minutes integer,
  customer_satisfaction integer,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_resolutions ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_resolutions
CREATE POLICY "Support can view resolutions"
  ON public.support_resolutions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = support_resolutions.organization_id
      AND organization_members.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Support can manage resolutions"
  ON public.support_resolutions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = support_resolutions.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('org_admin', 'support_agent')
    )
    OR has_role(auth.uid(), 'super_admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_support_resolutions_updated_at
  BEFORE UPDATE ON public.support_resolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();