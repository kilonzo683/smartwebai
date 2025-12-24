import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  subscription_plan: string;
  owner_id: string;
}

interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: AppRole;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  orgRole: AppRole | null;
  isLoading: boolean;
  setCurrentOrg: (org: Organization | null) => void;
  refetch: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<{ success: boolean; error?: string }>;
  hasOrgPermission: (requiredRoles: AppRole[]) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrg: null,
  organizations: [],
  orgRole: null,
  isLoading: true,
  setCurrentOrg: () => {},
  refetch: async () => {},
  createOrganization: async () => ({ success: false }),
  hasOrgPermission: () => false,
});

export const useOrganization = () => useContext(OrganizationContext);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgRole, setOrgRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setOrgRole(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch organizations where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map(m => m.organization_id);
        
        const { data: orgs, error: orgsError } = await supabase
          .from("organizations")
          .select("*")
          .in("id", orgIds);

        if (orgsError) throw orgsError;

        setOrganizations(orgs || []);

        // Set current org from localStorage or first org
        const savedOrgId = localStorage.getItem("currentOrgId");
        const savedOrg = orgs?.find(o => o.id === savedOrgId);
        const orgToSet = savedOrg || orgs?.[0] || null;
        
        setCurrentOrg(orgToSet);

        // Set role for current org
        if (orgToSet) {
          const membership = memberships.find(m => m.organization_id === orgToSet.id);
          setOrgRole(membership?.role as AppRole || null);
        }
      } else {
        // Check if user owns any organizations
        const { data: ownedOrgs } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", user.id);

        if (ownedOrgs && ownedOrgs.length > 0) {
          setOrganizations(ownedOrgs);
          setCurrentOrg(ownedOrgs[0]);
          setOrgRole("org_admin");
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem("currentOrgId", currentOrg.id);
    }
  }, [currentOrg]);

  const createOrganization = async (name: string, slug: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          slug: slug.toLowerCase().replace(/\s+/g, "-"),
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add creator as org_admin member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: "org_admin",
        });

      if (memberError) throw memberError;

      // Set default agent access
      const agentTypes = ["secretary", "support", "social", "lecturer"];
      const allowedRoles: AppRole[] = ["org_admin", "staff", "lecturer", "support_agent"];
      await supabase.from("agent_access").insert(
        agentTypes.map(agent => ({
          organization_id: org.id,
          agent_type: agent,
          allowed_roles: allowedRoles,
          is_enabled: true,
        }))
      );

      await fetchOrganizations();
      return { success: true };
    } catch (error: any) {
      console.error("Error creating organization:", error);
      return { success: false, error: error.message };
    }
  };

  const hasOrgPermission = (requiredRoles: AppRole[]) => {
    if (!orgRole) return false;
    return requiredRoles.includes(orgRole);
  };

  const handleSetCurrentOrg = (org: Organization | null) => {
    setCurrentOrg(org);
    if (org && user) {
      // Update org role when switching orgs
      supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", org.id)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setOrgRole(data?.role as AppRole || null);
        });
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        orgRole,
        isLoading,
        setCurrentOrg: handleSetCurrentOrg,
        refetch: fetchOrganizations,
        createOrganization,
        hasOrgPermission,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}