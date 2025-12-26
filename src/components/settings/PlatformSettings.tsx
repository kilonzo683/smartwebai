import { useState, useEffect, useRef } from "react";
import { Globe, Settings2, Shield, Zap, Save, Loader2, Upload, Image, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface PlatformConfig {
  platform_name: string;
  default_language: string;
  default_timezone: string;
  maintenance_mode: boolean;
  feature_toggles: {
    secretary_agent: boolean;
    support_agent: boolean;
    social_agent: boolean;
    lecturer_agent: boolean;
  };
}

interface AIGlobalConfig {
  default_confidence_threshold: number;
  global_escalation_rules: string;
  restricted_topics: string[];
  usage_limits: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

interface SecurityConfig {
  password_min_length: number;
  require_2fa: boolean;
  ip_whitelist: string[];
  data_retention_days: number;
  session_timeout_minutes: number;
}

interface WhiteLabelConfig {
  custom_domain: string;
  hide_platform_branding: boolean;
  custom_email_footer: string;
}

interface BrandingConfig {
  logo_url: string;
  favicon_url: string;
  hero_image_url: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
}

export function PlatformSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    platform_name: "AI Smart Work Assistant",
    default_language: "en",
    default_timezone: "UTC",
    maintenance_mode: false,
    feature_toggles: {
      secretary_agent: true,
      support_agent: true,
      social_agent: true,
      lecturer_agent: true,
    },
  });

  const [aiConfig, setAIConfig] = useState<AIGlobalConfig>({
    default_confidence_threshold: 0.7,
    global_escalation_rules: "Escalate when confidence < 0.5 or user requests human",
    restricted_topics: ["personal medical advice", "legal advice", "financial investment"],
    usage_limits: { free: 100, pro: 1000, enterprise: 10000 },
  });

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    password_min_length: 8,
    require_2fa: false,
    ip_whitelist: [],
    data_retention_days: 365,
    session_timeout_minutes: 60,
  });

  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
    custom_domain: "",
    hide_platform_branding: false,
    custom_email_footer: "",
  });

  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    logo_url: "",
    favicon_url: "",
    hero_image_url: "",
    tagline: "AI-Powered Work Assistant",
    primary_color: "#8B5CF6",
    secondary_color: "#6366F1",
  });

  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

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
          case "platform_config":
            setPlatformConfig(prev => ({ ...prev, ...value }));
            break;
          case "ai_config":
            setAIConfig(prev => ({ ...prev, ...value }));
            break;
          case "security_config":
            setSecurityConfig(prev => ({ ...prev, ...value }));
            break;
          case "white_label_config":
            setWhiteLabelConfig(prev => ({ ...prev, ...value }));
            break;
          case "branding_config":
            setBrandingConfig(prev => ({ ...prev, ...value }));
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
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: "logo" | "favicon" | "hero"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `platform/${imageType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("platform-assets")
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      setBrandingConfig(prev => ({
        ...prev,
        [`${imageType}_url`]: imageType === "hero" ? "hero_image_url" : `${imageType}_url`,
      }));

      // Update the correct field based on imageType
      if (imageType === "logo") {
        setBrandingConfig(prev => ({ ...prev, logo_url: urlWithTimestamp }));
      } else if (imageType === "favicon") {
        setBrandingConfig(prev => ({ ...prev, favicon_url: urlWithTimestamp }));
      } else if (imageType === "hero") {
        setBrandingConfig(prev => ({ ...prev, hero_image_url: urlWithTimestamp }));
      }

      toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      toast.error(`Failed to upload ${imageType}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleRemoveImage = (imageType: "logo" | "favicon" | "hero") => {
    if (imageType === "logo") {
      setBrandingConfig(prev => ({ ...prev, logo_url: "" }));
    } else if (imageType === "favicon") {
      setBrandingConfig(prev => ({ ...prev, favicon_url: "" }));
    } else if (imageType === "hero") {
      setBrandingConfig(prev => ({ ...prev, hero_image_url: "" }));
    }
    toast.success(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} removed`);
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
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">White-Label</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Configuration */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding</CardTitle>
              <CardDescription>Upload your logo, favicon, and customize brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Platform Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                    {brandingConfig.logo_url ? (
                      <img
                        src={brandingConfig.logo_url}
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
                    {brandingConfig.logo_url && (
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

              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
                    {brandingConfig.favicon_url ? (
                      <img
                        src={brandingConfig.favicon_url}
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
                    {brandingConfig.favicon_url && (
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
                    {brandingConfig.hero_image_url ? (
                      <img
                        src={brandingConfig.hero_image_url}
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
                    {brandingConfig.hero_image_url && (
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

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={brandingConfig.tagline}
                  onChange={(e) => setBrandingConfig(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Your platform tagline"
                />
              </div>

              {/* Brand Colors */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={brandingConfig.primary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, primary_color: e.target.value }))}
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
                      value={brandingConfig.secondary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={brandingConfig.secondary_color}
                      onChange={(e) => setBrandingConfig(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#6366F1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("branding_config", brandingConfig as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Configuration */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Global platform settings and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={platformConfig.platform_name}
                    onChange={(e) => setPlatformConfig(prev => ({ ...prev, platform_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={platformConfig.default_language}
                    onValueChange={(value) => setPlatformConfig(prev => ({ ...prev, default_language: value }))}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select
                    value={platformConfig.default_timezone}
                    onValueChange={(value) => setPlatformConfig(prev => ({ ...prev, default_timezone: value }))}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
                  </div>
                  <Switch
                    checked={platformConfig.maintenance_mode}
                    onCheckedChange={(checked) => setPlatformConfig(prev => ({ ...prev, maintenance_mode: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Agent Feature Toggles</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(platformConfig.feature_toggles).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="font-medium capitalize">{key.replace("_", " ")}</span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          setPlatformConfig(prev => ({
                            ...prev,
                            feature_toggles: { ...prev.feature_toggles, [key]: checked },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("platform_config", platformConfig as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Platform Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Global Controls */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Global Controls</CardTitle>
              <CardDescription>Configure AI behavior across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Default Confidence Threshold ({aiConfig.default_confidence_threshold})</Label>
                <input
                  type="range"
                  id="confidenceThreshold"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiConfig.default_confidence_threshold}
                  onChange={(e) => setAIConfig(prev => ({ ...prev, default_confidence_threshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalationRules">Global Escalation Rules</Label>
                <Textarea
                  id="escalationRules"
                  value={aiConfig.global_escalation_rules}
                  onChange={(e) => setAIConfig(prev => ({ ...prev, global_escalation_rules: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictedTopics">Restricted Topics (comma separated)</Label>
                <Textarea
                  id="restrictedTopics"
                  value={aiConfig.restricted_topics.join(", ")}
                  onChange={(e) => setAIConfig(prev => ({ ...prev, restricted_topics: e.target.value.split(",").map(s => s.trim()) }))}
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <Label>Usage Limits per Plan (messages/month)</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="freeLimit">Free Plan</Label>
                    <Input
                      id="freeLimit"
                      type="number"
                      value={aiConfig.usage_limits.free}
                      onChange={(e) => setAIConfig(prev => ({
                        ...prev,
                        usage_limits: { ...prev.usage_limits, free: parseInt(e.target.value) },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proLimit">Pro Plan</Label>
                    <Input
                      id="proLimit"
                      type="number"
                      value={aiConfig.usage_limits.pro}
                      onChange={(e) => setAIConfig(prev => ({
                        ...prev,
                        usage_limits: { ...prev.usage_limits, pro: parseInt(e.target.value) },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enterpriseLimit">Enterprise Plan</Label>
                    <Input
                      id="enterpriseLimit"
                      type="number"
                      value={aiConfig.usage_limits.enterprise}
                      onChange={(e) => setAIConfig(prev => ({
                        ...prev,
                        usage_limits: { ...prev.usage_limits, enterprise: parseInt(e.target.value) },
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings("ai_config", aiConfig as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Compliance */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>Platform-wide security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min={6}
                    max={32}
                    value={securityConfig.password_min_length}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={5}
                    max={1440}
                    value={securityConfig.session_timeout_minutes}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    min={30}
                    max={3650}
                    value={securityConfig.data_retention_days}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Require 2FA Globally</p>
                    <p className="text-sm text-muted-foreground">Enforce two-factor authentication</p>
                  </div>
                  <Switch
                    checked={securityConfig.require_2fa}
                    onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, require_2fa: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist (comma separated, leave empty to allow all)</Label>
                <Textarea
                  id="ipWhitelist"
                  value={securityConfig.ip_whitelist.join(", ")}
                  onChange={(e) => setSecurityConfig(prev => ({
                    ...prev,
                    ip_whitelist: e.target.value ? e.target.value.split(",").map(s => s.trim()) : [],
                  }))}
                  placeholder="192.168.1.1, 10.0.0.0/8"
                  rows={2}
                />
              </div>

              <Button 
                onClick={() => saveSettings("security_config", securityConfig as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* White-Label Settings */}
        <TabsContent value="whitelabel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>White-Label Settings (Enterprise)</CardTitle>
              <CardDescription>Customize branding for enterprise clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <Input
                  id="customDomain"
                  value={whiteLabelConfig.custom_domain}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, custom_domain: e.target.value }))}
                  placeholder="app.yourdomain.com"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Hide Platform Branding</p>
                  <p className="text-sm text-muted-foreground">Remove "Powered by" text and logos</p>
                </div>
                <Switch
                  checked={whiteLabelConfig.hide_platform_branding}
                  onCheckedChange={(checked) => setWhiteLabelConfig(prev => ({ ...prev, hide_platform_branding: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customEmailFooter">Custom Email Footer</Label>
                <Textarea
                  id="customEmailFooter"
                  value={whiteLabelConfig.custom_email_footer}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, custom_email_footer: e.target.value }))}
                  rows={3}
                  placeholder="© 2024 Your Company. All rights reserved."
                />
              </div>

              <Button 
                onClick={() => saveSettings("white_label_config", whiteLabelConfig as unknown as Json)} 
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save White-Label Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
