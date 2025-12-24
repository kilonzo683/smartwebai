import { useState, useEffect } from "react";
import { Building2, Mail, MessageSquare, Share2, Palette, Zap, Bell, Shield, Save, Loader2, TestTube } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import { SocialMediaConnections } from "./SocialMediaConnections";

interface OrgProfile {
  name: string;
  legal_name: string;
  industry: string;
  country: string;
  timezone: string;
  website: string;
  address: string;
}

interface ContactDetails {
  primary_email: string;
  support_email: string;
  phone: string;
  whatsapp_number: string;
  working_hours: string;
}

interface EmailConfig {
  provider: string;
  sender_name: string;
  sender_email: string;
  smtp_host: string;
  smtp_port: number;
}

interface WhatsAppConfig {
  business_number: string;
  api_token: string;
  auto_reply_enabled: boolean;
  business_hours_message: string;
}

interface BrandVoice {
  personality: string;
  writing_style: string;
  emoji_usage: string;
  formality_level: string;
}

interface AIBehavior {
  confidence_threshold: number;
  escalation_rules: string;
  allowed_topics: string[];
  restricted_topics: string[];
  max_response_length: number;
}

interface NotificationSettings {
  email_alerts: boolean;
  whatsapp_alerts: boolean;
  escalation_notifications: boolean;
  billing_alerts: boolean;
}

interface OrgSecuritySettings {
  min_password_length: number;
  require_2fa: boolean;
  session_timeout: number;
}

export function OrganizationSettings() {
  const { currentOrg } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    name: "",
    legal_name: "",
    industry: "",
    country: "",
    timezone: "UTC",
    website: "",
    address: "",
  });

  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    primary_email: "",
    support_email: "",
    phone: "",
    whatsapp_number: "",
    working_hours: "9:00 AM - 5:00 PM",
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: "smtp",
    sender_name: "",
    sender_email: "",
    smtp_host: "",
    smtp_port: 587,
  });

  const [whatsappConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({
    business_number: "",
    api_token: "",
    auto_reply_enabled: false,
    business_hours_message: "Thank you for contacting us. We'll respond during business hours.",
  });

  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    personality: "professional",
    writing_style: "formal",
    emoji_usage: "minimal",
    formality_level: "formal",
  });

  const [aiBehavior, setAIBehavior] = useState<AIBehavior>({
    confidence_threshold: 0.7,
    escalation_rules: "Escalate when confidence < 0.5",
    allowed_topics: [],
    restricted_topics: [],
    max_response_length: 500,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_alerts: true,
    whatsapp_alerts: false,
    escalation_notifications: true,
    billing_alerts: true,
  });

  const [security, setSecurity] = useState<OrgSecuritySettings>({
    min_password_length: 8,
    require_2fa: false,
    session_timeout: 60,
  });

  useEffect(() => {
    if (currentOrg) {
      fetchOrgSettings();
    }
  }, [currentOrg]);

  const fetchOrgSettings = async () => {
    if (!currentOrg) return;

    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", currentOrg.id)
        .single();

      if (org) {
        setOrgProfile({
          name: org.name || "",
          legal_name: "",
          industry: "",
          country: "",
          timezone: "UTC",
          website: "",
          address: "",
        });

        const settings = org.settings as Record<string, unknown> || {};
        if (settings.contact) setContactDetails(prev => ({ ...prev, ...settings.contact as ContactDetails }));
        if (settings.email) setEmailConfig(prev => ({ ...prev, ...settings.email as EmailConfig }));
        if (settings.whatsapp) setWhatsAppConfig(prev => ({ ...prev, ...settings.whatsapp as WhatsAppConfig }));
        if (settings.brand_voice) setBrandVoice(prev => ({ ...prev, ...settings.brand_voice as BrandVoice }));
        if (settings.ai_behavior) setAIBehavior(prev => ({ ...prev, ...settings.ai_behavior as AIBehavior }));
        if (settings.notifications) setNotifications(prev => ({ ...prev, ...settings.notifications as NotificationSettings }));
        if (settings.security) setSecurity(prev => ({ ...prev, ...settings.security as OrgSecuritySettings }));
      }
    } catch (error) {
      console.error("Error fetching org settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentOrg) return;
    setIsSaving(true);

    try {
      const settings = {
        contact: contactDetails as unknown,
        email: emailConfig as unknown,
        whatsapp: whatsappConfig as unknown,
        brand_voice: brandVoice as unknown,
        ai_behavior: aiBehavior as unknown,
        notifications: notifications as unknown,
        security: security as unknown,
      } as Json;

      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgProfile.name,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentOrg.id);

      if (error) throw error;
      toast.success("Organization settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    toast.info("Test email sent to " + contactDetails.primary_email);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please select an organization to configure settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="profile" className="gap-1">
            <Building2 className="w-4 h-4" />
            <span className="hidden lg:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1">
            <Mail className="w-4 h-4" />
            <span className="hidden lg:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1">
            <Mail className="w-4 h-4" />
            <span className="hidden lg:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1">
            <Share2 className="w-4 h-4" />
            <span className="hidden lg:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="brand" className="gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden lg:inline">Brand</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1">
            <Zap className="w-4 h-4" />
            <span className="hidden lg:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="w-4 h-4" />
            <span className="hidden lg:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden lg:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Organization Profile */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgProfile.name}
                    onChange={(e) => setOrgProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={orgProfile.legal_name}
                    onChange={(e) => setOrgProfile(prev => ({ ...prev, legal_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={orgProfile.industry}
                    onValueChange={(value) => setOrgProfile(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={orgProfile.country}
                    onChange={(e) => setOrgProfile(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={orgProfile.timezone}
                    onValueChange={(value) => setOrgProfile(prev => ({ ...prev, timezone: value }))}
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
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={orgProfile.website}
                    onChange={(e) => setOrgProfile(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Textarea
                  id="address"
                  value={orgProfile.address}
                  onChange={(e) => setOrgProfile(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Details */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>How customers can reach your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryEmail">Primary Email</Label>
                  <Input
                    id="primaryEmail"
                    type="email"
                    value={contactDetails.primary_email}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, primary_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={contactDetails.support_email}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, support_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={contactDetails.phone}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={contactDetails.whatsapp_number}
                    onChange={(e) => setContactDetails(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workingHours">Working Hours</Label>
                <Input
                  id="workingHours"
                  value={contactDetails.working_hours}
                  onChange={(e) => setContactDetails(prev => ({ ...prev, working_hours: e.target.value }))}
                  placeholder="9:00 AM - 5:00 PM, Monday - Friday"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Configuration */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Setup email sending for notifications and communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailProvider">Email Provider</Label>
                <Select
                  value={emailConfig.provider}
                  onValueChange={(value) => setEmailConfig(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={emailConfig.sender_name}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, sender_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    value={emailConfig.sender_email}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, sender_email: e.target.value }))}
                  />
                </div>
              </div>
              {emailConfig.provider === "smtp" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailConfig.smtp_port}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              )}
              <Button variant="outline" onClick={sendTestEmail}>
                <TestTube className="w-4 h-4 mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Configuration */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>Configure WhatsApp Business integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">Business Phone Number</Label>
                  <Input
                    id="businessNumber"
                    value={whatsappConfig.business_number}
                    onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, business_number: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    value={whatsappConfig.api_token}
                    onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, api_token: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Reply</p>
                  <p className="text-sm text-muted-foreground">Automatically reply to incoming messages</p>
                </div>
                <Switch
                  checked={whatsappConfig.auto_reply_enabled}
                  onCheckedChange={(checked) => setWhatsAppConfig(prev => ({ ...prev, auto_reply_enabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessHoursMessage">Business Hours Auto-Reply Message</Label>
                <Textarea
                  id="businessHoursMessage"
                  value={whatsappConfig.business_hours_message}
                  onChange={(e) => setWhatsAppConfig(prev => ({ ...prev, business_hours_message: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Connections */}
        <TabsContent value="social" className="space-y-4">
          <SocialMediaConnections />
        </TabsContent>

        {/* Brand Voice (PRO) */}
        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice & AI Tone</CardTitle>
              <CardDescription>Define how AI represents your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="personality">Brand Personality</Label>
                  <Select
                    value={brandVoice.personality}
                    onValueChange={(value) => setBrandVoice(prev => ({ ...prev, personality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writingStyle">Writing Style</Label>
                  <Select
                    value={brandVoice.writing_style}
                    onValueChange={(value) => setBrandVoice(prev => ({ ...prev, writing_style: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emojiUsage">Emoji Usage</Label>
                  <Select
                    value={brandVoice.emoji_usage}
                    onValueChange={(value) => setBrandVoice(prev => ({ ...prev, emoji_usage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formalityLevel">Formality Level</Label>
                  <Select
                    value={brandVoice.formality_level}
                    onValueChange={(value) => setBrandVoice(prev => ({ ...prev, formality_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_formal">Very Formal</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="informal">Informal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Behavior Controls (PRO) */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior Controls</CardTitle>
              <CardDescription>Fine-tune how AI agents respond</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiConfidence">Confidence Threshold ({aiBehavior.confidence_threshold})</Label>
                <input
                  type="range"
                  id="aiConfidence"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiBehavior.confidence_threshold}
                  onChange={(e) => setAIBehavior(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Higher values require more certainty before responding</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiEscalation">Escalation Rules</Label>
                <Textarea
                  id="aiEscalation"
                  value={aiBehavior.escalation_rules}
                  onChange={(e) => setAIBehavior(prev => ({ ...prev, escalation_rules: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxResponseLength">Max Response Length (words)</Label>
                <Input
                  id="maxResponseLength"
                  type="number"
                  value={aiBehavior.max_response_length}
                  onChange={(e) => setAIBehavior(prev => ({ ...prev, max_response_length: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictedTopics">Restricted Topics (comma separated)</Label>
                <Textarea
                  id="restrictedTopics"
                  value={aiBehavior.restricted_topics.join(", ")}
                  onChange={(e) => setAIBehavior(prev => ({
                    ...prev,
                    restricted_topics: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                  }))}
                  rows={2}
                  placeholder="legal advice, medical diagnosis"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: "email_alerts", label: "Email Alerts", desc: "Receive important updates via email" },
                  { key: "whatsapp_alerts", label: "WhatsApp Alerts", desc: "Get notifications on WhatsApp" },
                  { key: "escalation_notifications", label: "Escalation Notifications", desc: "Alert when issues are escalated" },
                  { key: "billing_alerts", label: "Billing Alerts", desc: "Notify about billing and subscription changes" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof NotificationSettings]}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Organization security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minPassword">Minimum Password Length</Label>
                  <Input
                    id="minPassword"
                    type="number"
                    min={6}
                    max={32}
                    value={security.min_password_length}
                    onChange={(e) => setSecurity(prev => ({ ...prev, min_password_length: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={5}
                    max={1440}
                    value={security.session_timeout}
                    onChange={(e) => setSecurity(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Require Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Enforce 2FA for all organization members</p>
                </div>
                <Switch
                  checked={security.require_2fa}
                  onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, require_2fa: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
