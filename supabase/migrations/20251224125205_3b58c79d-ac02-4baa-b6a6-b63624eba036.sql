-- Drop existing enum and recreate with new roles
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'staff', 'lecturer', 'support_agent', 'end_user');

-- Recreate user_roles table with new enum
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'end_user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8b5cf6',
  subscription_plan TEXT DEFAULT 'free',
  max_users INTEGER DEFAULT 10,
  max_agents INTEGER DEFAULT 4,
  max_messages_per_month INTEGER DEFAULT 1000,
  messages_used INTEGER DEFAULT 0,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organization members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'end_user',
  permissions JSONB DEFAULT '{}',
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Agent access control
CREATE TABLE public.agent_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  allowed_roles app_role[] NOT NULL DEFAULT ARRAY['org_admin'::app_role],
  is_enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_access ENABLE ROW LEVEL SECURITY;

-- Knowledge base documents
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_type TEXT,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Escalation tickets
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.escalation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  escalated_by UUID NOT NULL,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.escalation_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket notes/comments
CREATE TABLE public.ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.escalation_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_notes ENABLE ROW LEVEL SECURITY;

-- Activity audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Platform settings (super admin only)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Subscription plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_users INTEGER NOT NULL,
  max_agents INTEGER NOT NULL,
  max_messages INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, max_users, max_agents, max_messages, features) VALUES
  ('Free', 'free', 0, 0, 5, 2, 500, '{"support": "community", "storage_gb": 1}'),
  ('Starter', 'starter', 29, 290, 10, 4, 2000, '{"support": "email", "storage_gb": 5}'),
  ('Professional', 'professional', 99, 990, 50, 10, 10000, '{"support": "priority", "storage_gb": 25, "custom_branding": true}'),
  ('Enterprise', 'enterprise', 299, 2990, -1, -1, -1, '{"support": "dedicated", "storage_gb": -1, "custom_branding": true, "sso": true}');

-- RLS Policies

-- User roles: users can view own roles, super_admin can manage all
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admin can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Organizations: members can view, org_admin+ can update
CREATE POLICY "Members can view their organizations" ON public.organizations 
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid()) OR
    has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Owner and super admin can update organizations" ON public.organizations 
  FOR UPDATE USING (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated users can create organizations" ON public.organizations 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner and super admin can delete organizations" ON public.organizations 
  FOR DELETE USING (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

-- Organization members: org members can view, org_admin can manage
CREATE POLICY "Members can view org members" ON public.organization_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid()) OR
    has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Org admin can manage members" ON public.organization_members 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('org_admin', 'super_admin')) OR
    has_role(auth.uid(), 'super_admin')
  );

-- Agent access: org members can view, org_admin can manage
CREATE POLICY "Members can view agent access" ON public.agent_access 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = agent_access.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Org admin can manage agent access" ON public.agent_access 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = agent_access.organization_id AND user_id = auth.uid() AND role IN ('org_admin')) OR
    has_role(auth.uid(), 'super_admin')
  );

-- Knowledge base: org members can view based on role, org_admin/lecturer can manage
CREATE POLICY "Members can view knowledge base" ON public.knowledge_base 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = knowledge_base.organization_id AND user_id = auth.uid())
  );
CREATE POLICY "Org admin and lecturer can manage knowledge base" ON public.knowledge_base 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = knowledge_base.organization_id AND user_id = auth.uid() AND role IN ('org_admin', 'lecturer')) OR
    has_role(auth.uid(), 'super_admin')
  );

-- Escalation tickets: support agents and org_admin can view/manage
CREATE POLICY "Support can view tickets" ON public.escalation_tickets 
  FOR SELECT USING (
    escalated_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = escalation_tickets.organization_id AND user_id = auth.uid() AND role IN ('org_admin', 'support_agent')) OR
    has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Support can manage tickets" ON public.escalation_tickets 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = escalation_tickets.organization_id AND user_id = auth.uid() AND role IN ('org_admin', 'support_agent')) OR
    has_role(auth.uid(), 'super_admin')
  );

-- Ticket notes
CREATE POLICY "Ticket participants can view notes" ON public.ticket_notes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM escalation_tickets t 
      JOIN organization_members om ON om.organization_id = t.organization_id 
      WHERE t.id = ticket_notes.ticket_id AND om.user_id = auth.uid() AND om.role IN ('org_admin', 'support_agent')
    ) OR
    user_id = auth.uid() OR
    has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "Support can add notes" ON public.ticket_notes 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Audit log: org_admin can view their org, super_admin can view all
CREATE POLICY "Org admin can view audit log" ON public.audit_log 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = audit_log.organization_id AND user_id = auth.uid() AND role = 'org_admin') OR
    has_role(auth.uid(), 'super_admin')
  );
CREATE POLICY "System can insert audit log" ON public.audit_log 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Platform settings: super_admin only
CREATE POLICY "Super admin can manage platform settings" ON public.platform_settings 
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings 
  FOR SELECT USING (true);

-- Subscription plans: public read, super_admin manage
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Super admin can manage plans" ON public.subscription_plans 
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Update trigger for updated_at columns
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.escalation_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Helper function to get user's org role
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- Update handle_new_user_role to assign end_user by default
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'end_user');
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();