-- Create database backups table
CREATE TABLE IF NOT EXISTS public.database_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  backup_name text NOT NULL,
  backup_type text NOT NULL DEFAULT 'manual', -- manual, scheduled
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  file_path text,
  file_size bigint,
  tables_included text[] DEFAULT '{}',
  records_count integer DEFAULT 0,
  created_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;

-- Org admins can view and manage backups
CREATE POLICY "Org admins can manage backups" ON public.database_backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = database_backups.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('org_admin', 'super_admin')
    ) OR has_role(auth.uid(), 'super_admin')
  );

-- Create backup settings table
CREATE TABLE IF NOT EXISTS public.backup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  frequency text DEFAULT 'daily', -- hourly, daily, weekly
  retention_days integer DEFAULT 30,
  tables_to_backup text[] DEFAULT '{}',
  last_backup_at timestamptz,
  next_backup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- Org admins can manage backup settings
CREATE POLICY "Org admins can manage backup settings" ON public.backup_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = backup_settings.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('org_admin', 'super_admin')
    ) OR has_role(auth.uid(), 'super_admin')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_backup_settings_updated_at
  BEFORE UPDATE ON public.backup_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix organization_members RLS recursion by using security definer function
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
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

-- Create function to check org role without recursion
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id uuid, _org_id uuid)
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

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org admin can manage members" ON public.organization_members;

-- Recreate with non-recursive approach
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT USING (
    is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Org admin can manage members" ON public.organization_members
  FOR ALL USING (
    (get_org_role(auth.uid(), organization_id) IN ('org_admin', 'super_admin')) 
    OR has_role(auth.uid(), 'super_admin')
  );

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for backups
CREATE POLICY "Org admins can access backups" ON storage.objects
  FOR ALL USING (
    bucket_id = 'database-backups' 
    AND auth.uid() IS NOT NULL
  );

-- Enable pg_cron and pg_net extensions for scheduled backups
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;