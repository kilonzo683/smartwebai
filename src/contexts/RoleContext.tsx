import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface RoleContextType {
  userRole: AppRole | null;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isStaff: boolean;
  isLecturer: boolean;
  isSupportAgent: boolean;
  isEndUser: boolean;
  isLoading: boolean;
  refetch: () => void;
  hasRole: (role: AppRole) => boolean;
}

const RoleContext = createContext<RoleContextType>({
  userRole: null,
  isSuperAdmin: false,
  isOrgAdmin: false,
  isStaff: false,
  isLecturer: false,
  isSupportAgent: false,
  isEndUser: false,
  isLoading: true,
  refetch: () => {},
  hasRole: () => false,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    if (!user) {
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      // Get the highest privilege role
      const roles = data?.map(r => r.role as AppRole) || [];
      const rolePriority: AppRole[] = ["super_admin", "org_admin", "staff", "lecturer", "support_agent", "end_user"];
      
      const highestRole = rolePriority.find(r => roles.includes(r)) || "end_user";
      setUserRole(highestRole);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setUserRole("end_user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole) => {
    if (!userRole) return false;
    const rolePriority: AppRole[] = ["super_admin", "org_admin", "staff", "lecturer", "support_agent", "end_user"];
    const userIndex = rolePriority.indexOf(userRole);
    const requiredIndex = rolePriority.indexOf(role);
    return userIndex <= requiredIndex;
  };

  return (
    <RoleContext.Provider
      value={{
        userRole,
        isSuperAdmin: userRole === "super_admin",
        isOrgAdmin: userRole === "org_admin" || userRole === "super_admin",
        isStaff: hasRole("staff"),
        isLecturer: hasRole("lecturer"),
        isSupportAgent: hasRole("support_agent"),
        isEndUser: true,
        isLoading,
        refetch: fetchRoles,
        hasRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}