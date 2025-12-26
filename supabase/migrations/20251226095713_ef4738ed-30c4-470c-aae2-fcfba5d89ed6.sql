-- Update SECURITY DEFINER functions to add NULL validation

-- Update get_org_role function with NULL checks
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id uuid, _org_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN _user_id IS NULL OR _org_id IS NULL THEN NULL
    ELSE (
      SELECT role FROM public.organization_members
      WHERE user_id = _user_id AND organization_id = _org_id
      LIMIT 1
    )
  END
$function$;

-- Update has_role function with NULL checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN _user_id IS NULL OR _role IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$function$;

-- Update is_org_member function with NULL checks
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN _user_id IS NULL OR _org_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = _user_id AND organization_id = _org_id
    )
  END
$function$;