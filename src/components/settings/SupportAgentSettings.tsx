import { useState, useEffect } from "react";
import { Headphones, Bell, MessageSquare, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SupportPreferences {
  auto_accept_escalations: boolean;
  max_concurrent_chats: number;
  status: string;
  away_message: string;
}

interface ResponseTemplates {
  greeting: string;
  closing: string;
  escalation_notice: string;
  hold_message: string;
}

interface SupportNotifications {
  new_escalation: boolean;
  chat_assigned: boolean;
  priority_tickets: boolean;
  sla_warnings: boolean;
}

export function SupportAgentSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [preferences, setPreferences] = useState<SupportPreferences>({
    auto_accept_escalations: false,
    max_concurrent_chats: 3,
    status: "available",
    away_message: "I'm currently away. Another agent will assist you shortly.",
  });

  const [templates, setTemplates] = useState<ResponseTemplates>({
    greeting: "Hello! Thank you for contacting support. How can I help you today?",
    closing: "Thank you for contacting us. Is there anything else I can help with?",
    escalation_notice: "I'm transferring you to a specialist who can better assist with your request.",
    hold_message: "Please hold while I look into this for you.",
  });

  const [notifications, setNotifications] = useState<SupportNotifications>({
    new_escalation: true,
    chat_assigned: true,
    priority_tickets: true,
    sla_warnings: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const savedPrefs = localStorage.getItem(`support_prefs_${user.id}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.templates) setTemplates(parsed.templates);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (error) {
      console.error("Error fetching support settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      localStorage.setItem(`support_prefs_${user.id}`, JSON.stringify({
        preferences,
        templates,
        notifications,
      }));
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
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences" className="gap-2">
            <Headphones className="w-4 h-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Support Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Preferences</CardTitle>
              <CardDescription>Configure your support agent settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Current Status</Label>
                  <Select
                    value={preferences.status}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="away">Away</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxChats">Max Concurrent Chats</Label>
                  <Input
                    id="maxChats"
                    type="number"
                    min={1}
                    max={10}
                    value={preferences.max_concurrent_chats}
                    onChange={(e) => setPreferences(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Accept Escalations</p>
                  <p className="text-sm text-muted-foreground">Automatically accept new escalated tickets</p>
                </div>
                <Switch
                  checked={preferences.auto_accept_escalations}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, auto_accept_escalations: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="awayMessage">Away Message</Label>
                <Textarea
                  id="awayMessage"
                  value={preferences.away_message}
                  onChange={(e) => setPreferences(prev => ({ ...prev, away_message: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Response Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>Default messages for common scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={templates.greeting}
                  onChange={(e) => setTemplates(prev => ({ ...prev, greeting: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing">Closing Message</Label>
                <Textarea
                  id="closing"
                  value={templates.closing}
                  onChange={(e) => setTemplates(prev => ({ ...prev, closing: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escalation">Escalation Notice</Label>
                <Textarea
                  id="escalation"
                  value={templates.escalation_notice}
                  onChange={(e) => setTemplates(prev => ({ ...prev, escalation_notice: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hold">Hold Message</Label>
                <Textarea
                  id="hold"
                  value={templates.hold_message}
                  onChange={(e) => setTemplates(prev => ({ ...prev, hold_message: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure support-related alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "new_escalation", label: "New Escalation", desc: "Notify when a case is escalated" },
                { key: "chat_assigned", label: "Chat Assigned", desc: "Notify when a chat is assigned to you" },
                { key: "priority_tickets", label: "Priority Tickets", desc: "Alert for high-priority tickets" },
                { key: "sla_warnings", label: "SLA Warnings", desc: "Warn when approaching SLA limits" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof SupportNotifications]}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
