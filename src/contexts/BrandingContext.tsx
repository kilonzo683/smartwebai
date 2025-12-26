import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandingSettings {
  platformName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
}

interface BrandingContextType {
  branding: BrandingSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  platformName: "AI Work Assistant",
  logoUrl: null,
  faviconUrl: null,
  heroImageUrl: null,
  tagline: "AI-Powered Work Assistant",
  primaryColor: "#8B5CF6",
  secondaryColor: "#6366F1",
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  refetch: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["general_settings", "branding_settings"]);

      if (error) throw error;

      let newBranding = { ...defaultBranding };

      data?.forEach((setting) => {
        const value = setting.value as Record<string, unknown>;
        if (setting.key === "general_settings") {
          if (value.platform_name) {
            newBranding.platformName = value.platform_name as string;
          }
        }
        if (setting.key === "branding_settings") {
          if (value.logo_url) newBranding.logoUrl = value.logo_url as string;
          if (value.favicon_url) newBranding.faviconUrl = value.favicon_url as string;
          if (value.hero_image_url) newBranding.heroImageUrl = value.hero_image_url as string;
          if (value.tagline) newBranding.tagline = value.tagline as string;
          if (value.primary_color) newBranding.primaryColor = value.primary_color as string;
          if (value.secondary_color) newBranding.secondaryColor = value.secondary_color as string;
        }
      });

      setBranding(newBranding);

      // Update favicon dynamically
      if (newBranding.faviconUrl) {
        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (favicon) {
          favicon.href = newBranding.faviconUrl;
        }
      }

      // Update document title
      document.title = newBranding.platformName;

    } catch (error) {
      console.error("Error fetching branding settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
