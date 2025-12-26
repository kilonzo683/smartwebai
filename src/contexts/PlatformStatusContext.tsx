import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStatus {
  maintenanceMode: boolean;
  demoMode: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const PlatformStatusContext = createContext<PlatformStatus>({
  maintenanceMode: false,
  demoMode: false,
  isLoading: true,
  refetch: async () => {},
});

export const usePlatformStatus = () => useContext(PlatformStatusContext);

export function PlatformStatusProvider({ children }: { children: ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .eq("key", "general_settings")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching platform status:", error);
        return;
      }

      if (data?.value && typeof data.value === "object") {
        const settings = data.value as { maintenance_mode?: boolean; demo_mode?: boolean };
        setMaintenanceMode(settings.maintenance_mode ?? false);
        setDemoMode(settings.demo_mode ?? false);
      }
    } catch (error) {
      console.error("Error fetching platform status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Subscribe to changes in platform_settings
    const channel = supabase
      .channel("platform_status_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
          filter: "key=eq.general_settings",
        },
        () => {
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PlatformStatusContext.Provider
      value={{
        maintenanceMode,
        demoMode,
        isLoading,
        refetch: fetchStatus,
      }}
    >
      {children}
    </PlatformStatusContext.Provider>
  );
}
