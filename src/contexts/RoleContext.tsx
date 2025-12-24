import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RoleContextType {
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const RoleContext = createContext<RoleContextType>({
  isAdmin: false,
  isModerator: false,
  isLoading: true,
  refetch: () => {},
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsModerator(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;

      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes("admin"));
      setIsModerator(roles.includes("moderator") || roles.includes("admin"));
    } catch (error) {
      console.error("Error fetching roles:", error);
      setIsAdmin(false);
      setIsModerator(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [user]);

  return (
    <RoleContext.Provider value={{ isAdmin, isModerator, isLoading, refetch: fetchRoles }}>
      {children}
    </RoleContext.Provider>
  );
}