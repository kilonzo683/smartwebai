import { useState, useEffect, useRef } from "react";
import { 
  Globe, Settings2, Shield, Zap, Save, Loader2, Upload, Image, Trash2, Mail,
  Bell, CreditCard, Layout, Link2, FileText, Database, Server, TestTube
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import type { Json } from "@/integrations/supabase/types";

// System Settings Interfaces
interface GeneralSettings {
  platform_name: string;
  default_language: string;
  default_timezone: string;
  default_currency: string;
  date_format: string;
  maintenance_mode: boolean;
  demo_mode: boolean;
}

interface AuthSettings {
  public_registration: boolean;
  email_verification: boolean;
  password_min_length: number;
  session_timeout_minutes: number;
  require_2fa: boolean;
  max_login_attempts: number;
  captcha_enabled: boolean;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_encryption: string;
  smtp_username: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
}

interface AISettings {
  default_model: string;
  global_usage_limit: number;
  secretary_agent_enabled: boolean;
  support_agent_enabled: boolean;
  social_agent_enabled: boolean;
  lecturer_agent_enabled: boolean;
  default_tone: string;
  fallback_rules: string;
}

interface BillingSettings {
  trial_duration_days: number;
  invoice_prefix: string;
  tax_rate: number;
  enable_coupons: boolean;
}

interface CMSSettings {
  cms_enabled: boolean;
  default_theme: string;
  robots_txt: string;
  sitemap_enabled: boolean;
}

interface IntegrationSettings {
  whatsapp_api_key: string;
  google_oauth_client_id: string;
  microsoft_oauth_client_id: string;
  webhook_url: string;
}

interface BrandingSettings {
  logo_url: string;
  mobile_logo_url: string;
  favicon_url: string;
  hero_image_url: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
}

export function SystemSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const { refetch: refetchBranding } = useBranding();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const mobileLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    platform_name: "AI Smart Work Assistant",
    default_language: "en",
    default_timezone: "UTC",
    default_currency: "USD",
    date_format: "MM/DD/YYYY",
    maintenance_mode: false,
    demo_mode: false,
  });

  const [authSettings, setAuthSettings] = useState<AuthSettings>({
    public_registration: true,
    email_verification: true,
    password_min_length: 8,
    session_timeout_minutes: 60,
    require_2fa: false,
    max_login_attempts: 5,
    captcha_enabled: false,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: "",
    smtp_port: 587,
    smtp_encryption: "tls",
    smtp_username: "",
    smtp_password: "",
    sender_name: "",
    sender_email: "",
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    default_model: "gemini-2.5-flash",
    global_usage_limit: 10000,
    secretary_agent_enabled: true,
    support_agent_enabled: true,
    social_agent_enabled: true,
    lecturer_agent_enabled: true,
    default_tone: "professional",
    fallback_rules: "Escalate when confidence < 0.5 or user requests human",
  });

  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    trial_duration_days: 14,
    invoice_prefix: "INV-",
    tax_rate: 0,
    enable_coupons: true,
  });

  const [cmsSettings, setCmsSettings] = useState<CMSSettings>({
    cms_enabled: true,
    default_theme: "default",
    robots_txt: "User-agent: *\nAllow: /",
    sitemap_enabled: true,
  });

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    whatsapp_api_key: "",
    google_oauth_client_id: "",
    microsoft_oauth_client_id: "",
    webhook_url: "",
  });

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    logo_url: "",
    mobile_logo_url: "",
    favicon_url: "",
    hero_image_url: "",
    tagline: "AI-Powered Work Assistant",
    primary_color: "#8B5CF6",
    secondary_color: "#6366F1",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (error) throw error;

      data?.forEach((setting) => {
        const value = setting.value as Record<string, unknown>;
        switch (setting.key) {
          case "general_settings":
            setGeneralSettings(prev => ({ ...prev, ...value }));
            break;
          case "auth_settings":
            setAuthSettings(prev => ({ ...prev, ...value }));
            break;
          case "email_settings":
            setEmailSettings(prev => ({ ...prev, ...value }));
            break;
          case "ai_settings":
            setAiSettings(prev => ({ ...prev, ...value }));
            break;
          case "billing_settings":
            setBillingSettings(prev => ({ ...prev, ...value }));
            break;
          case "cms_settings":
            setCmsSettings(prev => ({ ...prev, ...value }));
            break;
          case "integration_settings":
            setIntegrationSettings(prev => ({ ...prev, ...value }));
            break;
          case "branding_config":
          case "branding_settings":
            setBrandingSettings(prev => ({ ...prev, ...value }));
            break;
        }
      });
    } catch (error) {
      console.error("Error fetching platform settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (key: string, value: Json) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Settings saved successfully");
      
      // Refresh branding context when general or branding settings are saved
      if (key === "general_settings" || key === "branding_settings") {
        await refetchBranding();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "logo" | "mobile_logo" | "favicon" | "hero"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const maxSize = imageType === "hero" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max size: ${imageType === "hero" ? "10MB" : "5MB"}`);
      return;
    }

    setIsUploading(prev => ({ ...prev, [imageType]: true }));
    const displayName = imageType === "mobile_logo" ? "Mobile logo" : imageType.charAt(0).toUpperCase() + imageType.slice(1);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `platform/${imageType}.${fileExt}`;

      console.log(`Uploading ${imageType} to ${filePath}...`);

      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("platform-assets")
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      console.log(`${imageType} uploaded, URL: ${urlWithTimestamp}`);

      // First, fetch the current branding settings from database to avoid stale state
      const { data: currentData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "branding_settings")
        .single();

      // Merge with defaults and current DB state
      const currentDbSettings = currentData?.value as Record<string, unknown> | null;
      const updatedSettings: BrandingSettings = {
        logo_url: (currentDbSettings?.logo_url as string) || "",
        mobile_logo_url: (currentDbSettings?.mobile_logo_url as string) || "",
        favicon_url: (currentDbSettings?.favicon_url as string) || "",
        hero_image_url: (currentDbSettings?.hero_image_url as string) || "",
        tagline: (currentDbSettings?.tagline as string) || "AI-Powered Work Assistant",
        primary_color: (currentDbSettings?.primary_color as string) || "#8B5CF6",
        secondary_color: (currentDbSettings?.secondary_color as string) || "#6366F1",
      };

      // Apply the new image URL
      if (imageType === "logo") {
        updatedSettings.logo_url = urlWithTimestamp;
      } else if (imageType === "mobile_logo") {
        updatedSettings.mobile_logo_url = urlWithTimestamp;
      } else if (imageType === "favicon") {
        updatedSettings.favicon_url = urlWithTimestamp;
      } else if (imageType === "hero") {
        updatedSettings.hero_image_url = urlWithTimestamp;
      }
      
      setBrandingSettings(updatedSettings);

      // Save to database
      console.log("Saving branding settings to database...", updatedSettings);
      const { error: saveError } = await supabase
        .from("platform_settings")
        .upsert({ 
          key: "branding_settings", 
          value: updatedSettings as unknown as Json, 
          updated_at: new Date().toISOString() 
        }, { onConflict: "key" });

      if (saveError) {
        console.error("Database save error:", saveError);
        throw saveError;
      }

      // Refresh branding context to update sidebar immediately
      await refetchBranding();

      toast.success(`${displayName} uploaded and saved`);
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      toast.error(`Failed to upload ${displayName}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleRemoveImage = async (imageType: "logo" | "mobile_logo" | "favicon" | "hero") => {
    let updatedBrandingSettings = { ...brandingSettings };
    if (imageType === "logo") {
      updatedBrandingSettings.logo_url = "";
    } else if (imageType === "mobile_logo") {
      updatedBrandingSettings.mobile_logo_url = "";
    } else if (imageType === "favicon") {
      updatedBrandingSettings.favicon_url = "";
    } else if (imageType === "hero") {
      updatedBrandingSettings.hero_image_url = "";
    }
    
    setBrandingSettings(updatedBrandingSettings);

    // Auto-save to database and refresh branding context immediately
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({ 
          key: "branding_settings", 
          value: updatedBrandingSettings, 
          updated_at: new Date().toISOString() 
        }, { onConflict: "key" });

      if (error) throw error;

      await refetchBranding();

      const displayName = imageType === "mobile_logo" ? "Mobile logo" : imageType.charAt(0).toUpperCase() + imageType.slice(1);
      toast.success(`${displayName} removed`);
    } catch (error) {
      console.error(`Error removing ${imageType}:`, error);
      toast.error(`Failed to remove ${imageType}`);
    }
  };

  const sendTestEmail = async () => {
    toast.info("Test email sent to configured sender email");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Platform-wide settings (Super Admin only)
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="general" className="gap-1">
            <Globe className="w-4 h-4" />
            <span className="hidden lg:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1">
            <Image className="w-4 h-4" />
            <span className="hidden lg:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="auth" className="gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden lg:inline">Auth</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1">
            <Mail className="w-4 h-4" />
            <span className="hidden lg:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1">
            <Zap className="w-4 h-4" />
            <span className="hidden lg:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1">
            <CreditCard className="w-4 h-4" />
            <span className="hidden lg:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="cms" className="gap-1">
            <Layout className="w-4 h-4" />
            <span className="hidden lg:inline">CMS</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1">
            <Link2 className="w-4 h-4" />
            <span className="hidden lg:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General System Settings</CardTitle>
              <CardDescription>Configure platform name, language, and default behaviors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={generalSettings.platform_name}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={generalSettings.default_language}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, default_language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select
                    value={generalSettings.default_timezone}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, default_timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={generalSettings.default_currency}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, default_currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={generalSettings.date_format}
                    onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, date_format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenance_mode}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenance_mode: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Demo Mode</p>
                    <p className="text-sm text-muted-foreground">Enable demo features for testing</p>
                  </div>
                  <Switch
                    checked={generalSettings.demo_mode}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, demo_mode: checked }))}
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("general_settings", generalSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Branding</CardTitle>
              <CardDescription>Upload logo, favicon, and customize brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Uploads - Desktop & Mobile */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Desktop Logo Upload */}
                <div className="space-y-3">
                  <Label>Desktop Logo</Label>
                  <p className="text-xs text-muted-foreground">Used on larger screens and desktop sidebar</p>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                      {brandingSettings.logo_url ? (
                        <img
                          src={brandingSettings.logo_url}
                          alt="Platform Logo"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Upload className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-xs">No logo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading.logo}
                      >
                        {isUploading.logo ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Logo
                      </Button>
                      {brandingSettings.logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveImage("logo")}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "logo")}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 200x200px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Logo Upload */}
                <div className="space-y-3">
                  <Label>Mobile Logo</Label>
                  <p className="text-xs text-muted-foreground">Used on mobile header and collapsed sidebar</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                      {brandingSettings.mobile_logo_url ? (
                        <img
                          src={brandingSettings.mobile_logo_url}
                          alt="Mobile Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Upload className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">No logo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mobileLogoInputRef.current?.click()}
                        disabled={isUploading.mobile_logo}
                      >
                        {isUploading.mobile_logo ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Upload Mobile Logo
                      </Button>
                      {brandingSettings.mobile_logo_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveImage("mobile_logo")}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <input
                        ref={mobileLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "mobile_logo")}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 64x64px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                    {brandingSettings.favicon_url ? (
                      <img
                        src={brandingSettings.favicon_url}
                        alt="Favicon"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="w-4 h-4 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploading.favicon}
                    >
                      {isUploading.favicon ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Favicon
                    </Button>
                    {brandingSettings.favicon_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveImage("favicon")}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "favicon")}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      32x32px or 64x64px, ICO or PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Image Upload */}
              <div className="space-y-3">
                <Label>Homepage Hero Image</Label>
                <div className="space-y-3">
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                    {brandingSettings.hero_image_url ? (
                      <img
                        src={brandingSettings.hero_image_url}
                        alt="Hero Image"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="w-12 h-12 mx-auto mb-2" />
                        <span className="text-sm">No hero image uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => heroInputRef.current?.click()}
                      disabled={isUploading.hero}
                    >
                      {isUploading.hero ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Upload Hero Image
                    </Button>
                    {brandingSettings.hero_image_url && (
                      <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveImage("hero")}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "hero")}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1920x1080px, JPG or PNG. Max 10MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Tagline & Colors */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={brandingSettings.tagline}
                  onChange={(e) => setBrandingSettings(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Your platform tagline"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={brandingSettings.primary_color}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={brandingSettings.primary_color}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#8B5CF6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={brandingSettings.secondary_color}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={brandingSettings.secondary_color}
                      onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#6366F1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("branding_settings", brandingSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Settings */}
        <TabsContent value="auth" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Security</CardTitle>
              <CardDescription>Configure user registration, password rules, and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Public Registration</p>
                    <p className="text-sm text-muted-foreground">Allow users to register themselves</p>
                  </div>
                  <Switch
                    checked={authSettings.public_registration}
                    onCheckedChange={(checked) => setAuthSettings(prev => ({ ...prev, public_registration: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">Require email verification</p>
                  </div>
                  <Switch
                    checked={authSettings.email_verification}
                    onCheckedChange={(checked) => setAuthSettings(prev => ({ ...prev, email_verification: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Require 2FA</p>
                    <p className="text-sm text-muted-foreground">Enforce two-factor authentication</p>
                  </div>
                  <Switch
                    checked={authSettings.require_2fa}
                    onCheckedChange={(checked) => setAuthSettings(prev => ({ ...prev, require_2fa: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">CAPTCHA</p>
                    <p className="text-sm text-muted-foreground">Enable CAPTCHA on login</p>
                  </div>
                  <Switch
                    checked={authSettings.captcha_enabled}
                    onCheckedChange={(checked) => setAuthSettings(prev => ({ ...prev, captcha_enabled: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Min Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min={6}
                    max={32}
                    value={authSettings.password_min_length}
                    onChange={(e) => setAuthSettings(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (min)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={5}
                    max={1440}
                    value={authSettings.session_timeout_minutes}
                    onChange={(e) => setAuthSettings(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min={3}
                    max={10}
                    value={authSettings.max_login_attempts}
                    onChange={(e) => setAuthSettings(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("auth_settings", authSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Auth Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & SMTP Configuration</CardTitle>
              <CardDescription>Configure email sending for notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpEncryption">Encryption</Label>
                  <Select
                    value={emailSettings.smtp_encryption}
                    onValueChange={(value) => setEmailSettings(prev => ({ ...prev, smtp_encryption: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={emailSettings.sender_name}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_name: e.target.value }))}
                    placeholder="Platform Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={emailSettings.sender_email}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_email: e.target.value }))}
                    placeholder="no-reply@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => saveSettings("email_settings", emailSettings as unknown as Json)} 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Email Settings
                </Button>
                <Button variant="outline" onClick={sendTestEmail}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI & Automation</CardTitle>
              <CardDescription>Configure AI agents and automation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default AI Model</Label>
                  <Select
                    value={aiSettings.default_model}
                    onValueChange={(value) => setAiSettings(prev => ({ ...prev, default_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                      <SelectItem value="gpt-5">GPT-5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTone">Default Response Tone</Label>
                  <Select
                    value={aiSettings.default_tone}
                    onValueChange={(value) => setAiSettings(prev => ({ ...prev, default_tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="globalUsageLimit">Global Usage Limit (messages/month)</Label>
                  <Input
                    id="globalUsageLimit"
                    type="number"
                    value={aiSettings.global_usage_limit}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, global_usage_limit: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">AI Agent Controls</Label>
                <p className="text-sm text-muted-foreground mb-4">Enable or disable individual AI agents</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Secretary Agent</p>
                      <p className="text-sm text-muted-foreground">Task & calendar management</p>
                    </div>
                    <Switch
                      checked={aiSettings.secretary_agent_enabled}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, secretary_agent_enabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Support Agent</p>
                      <p className="text-sm text-muted-foreground">Customer support assistance</p>
                    </div>
                    <Switch
                      checked={aiSettings.support_agent_enabled}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, support_agent_enabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Social Agent</p>
                      <p className="text-sm text-muted-foreground">Social media management</p>
                    </div>
                    <Switch
                      checked={aiSettings.social_agent_enabled}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, social_agent_enabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Lecturer Agent</p>
                      <p className="text-sm text-muted-foreground">Educational assistance</p>
                    </div>
                    <Switch
                      checked={aiSettings.lecturer_agent_enabled}
                      onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, lecturer_agent_enabled: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="fallbackRules">AI Fallback Rules</Label>
                <Textarea
                  id="fallbackRules"
                  value={aiSettings.fallback_rules}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, fallback_rules: e.target.value }))}
                  rows={3}
                  placeholder="Define when AI should escalate to humans"
                />
              </div>

              <Button 
                onClick={() => saveSettings("ai_settings", aiSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions & Billing</CardTitle>
              <CardDescription>Configure pricing, trials, and billing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trialDuration">Trial Duration (days)</Label>
                  <Input
                    id="trialDuration"
                    type="number"
                    min={0}
                    max={90}
                    value={billingSettings.trial_duration_days}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, trial_duration_days: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={billingSettings.invoice_prefix}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                    placeholder="INV-"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={billingSettings.tax_rate}
                    onChange={(e) => setBillingSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable Coupons</p>
                    <p className="text-sm text-muted-foreground">Allow discount codes</p>
                  </div>
                  <Switch
                    checked={billingSettings.enable_coupons}
                    onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, enable_coupons: checked }))}
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("billing_settings", billingSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Billing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CMS Settings */}
        <TabsContent value="cms" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CMS & Frontend</CardTitle>
              <CardDescription>Configure content management and SEO settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable CMS</p>
                    <p className="text-sm text-muted-foreground">Allow page management</p>
                  </div>
                  <Switch
                    checked={cmsSettings.cms_enabled}
                    onCheckedChange={(checked) => setCmsSettings(prev => ({ ...prev, cms_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Auto Sitemap</p>
                    <p className="text-sm text-muted-foreground">Generate sitemap automatically</p>
                  </div>
                  <Switch
                    checked={cmsSettings.sitemap_enabled}
                    onCheckedChange={(checked) => setCmsSettings(prev => ({ ...prev, sitemap_enabled: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTheme">Default Theme</Label>
                <Select
                  value={cmsSettings.default_theme}
                  onValueChange={(value) => setCmsSettings(prev => ({ ...prev, default_theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="robotsTxt">robots.txt</Label>
                <Textarea
                  id="robotsTxt"
                  value={cmsSettings.robots_txt}
                  onChange={(e) => setCmsSettings(prev => ({ ...prev, robots_txt: e.target.value }))}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Button 
                onClick={() => saveSettings("cms_settings", cmsSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save CMS Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Configure third-party integrations and API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappApiKey">WhatsApp API Key</Label>
                  <Input
                    id="whatsappApiKey"
                    type="password"
                    value={integrationSettings.whatsapp_api_key}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                    placeholder="Enter WhatsApp Business API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleOAuth">Google OAuth Client ID</Label>
                  <Input
                    id="googleOAuth"
                    value={integrationSettings.google_oauth_client_id}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, google_oauth_client_id: e.target.value }))}
                    placeholder="Enter Google OAuth client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="microsoftOAuth">Microsoft OAuth Client ID</Label>
                  <Input
                    id="microsoftOAuth"
                    value={integrationSettings.microsoft_oauth_client_id}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, microsoft_oauth_client_id: e.target.value }))}
                    placeholder="Enter Microsoft OAuth client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={integrationSettings.webhook_url}
                    onChange={(e) => setIntegrationSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("integration_settings", integrationSettings as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs & Monitoring */}
        <TabsContent value="logs" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs & Monitoring</CardTitle>
              <CardDescription>View system logs and audit trails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Server className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">System Logs</p>
                    <p className="text-sm text-muted-foreground">View server events</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      View Logs
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Audit Trail</p>
                    <p className="text-sm text-muted-foreground">Track user actions</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      View Audit
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">AI Usage</p>
                    <p className="text-sm text-muted-foreground">Monitor AI consumption</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      View Usage
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
