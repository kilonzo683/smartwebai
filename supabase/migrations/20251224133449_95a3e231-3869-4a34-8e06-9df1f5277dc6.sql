-- Communication Channels table
CREATE TABLE public.communication_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('whatsapp', 'email', 'webchat', 'sms')),
  name text NOT NULL,
  is_enabled boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  credentials jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Channel routing rules
CREATE TABLE public.channel_routing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  priority integer DEFAULT 0,
  conditions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Analytics events table
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  agent_type text,
  channel text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Agent performance metrics (aggregated)
CREATE TABLE public.agent_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  date date NOT NULL,
  total_conversations integer DEFAULT 0,
  resolved_conversations integer DEFAULT 0,
  escalated_conversations integer DEFAULT 0,
  avg_response_time_seconds integer DEFAULT 0,
  avg_confidence_score numeric DEFAULT 0,
  avg_satisfaction_score numeric DEFAULT 0,
  total_messages integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, agent_type, date)
);

-- Enable RLS on all tables
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;

-- Policies for communication_channels
CREATE POLICY "Org members can view channels"
ON public.communication_channels FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_members.organization_id = communication_channels.organization_id
  AND organization_members.user_id = auth.uid()
));

CREATE POLICY "Org admin can manage channels"
ON public.communication_channels FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = communication_channels.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('org_admin', 'super_admin')
  )) OR has_role(auth.uid(), 'super_admin')
);

-- Policies for routing rules
CREATE POLICY "Org members can view routing rules"
ON public.channel_routing_rules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_members.organization_id = channel_routing_rules.organization_id
  AND organization_members.user_id = auth.uid()
));

CREATE POLICY "Org admin can manage routing rules"
ON public.channel_routing_rules FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = channel_routing_rules.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('org_admin', 'super_admin')
  )) OR has_role(auth.uid(), 'super_admin')
);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for analytics_events
CREATE POLICY "Org members can view analytics"
ON public.analytics_events FOR SELECT
USING (
  organization_id IS NULL OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = analytics_events.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analytics"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for agent_performance
CREATE POLICY "Org members can view performance"
ON public.agent_performance FOR SELECT
USING (EXISTS (
  SELECT 1 FROM organization_members
  WHERE organization_members.organization_id = agent_performance.organization_id
  AND organization_members.user_id = auth.uid()
));

CREATE POLICY "System can manage performance"
ON public.agent_performance FOR ALL
USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_analytics_events_org_date ON public.analytics_events(organization_id, created_at);
CREATE INDEX idx_agent_performance_org_date ON public.agent_performance(organization_id, date);
CREATE INDEX idx_channels_org ON public.communication_channels(organization_id);

-- Triggers for updated_at
CREATE TRIGGER update_communication_channels_updated_at
BEFORE UPDATE ON public.communication_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;