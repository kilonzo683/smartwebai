import { useState, useEffect } from "react";
import { Globe, Settings2, Shield, Zap, Save, Loader2 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="platform" className="gap-2">
            <Globe className="w-4 h-4" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Zap className="w-4 h-4" />
            AI Controls
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="gap-2">
            <Settings2 className="w-4 h-4" />
            White-Label
          </TabsTrigger>
        </TabsList>

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
