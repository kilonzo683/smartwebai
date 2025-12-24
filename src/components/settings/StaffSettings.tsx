import { useState, useEffect } from "react";
import { User, Bell, Zap, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StaffPreferences {
  preferred_reply_tone: string;
  default_response_length: string;
  working_hours_start: string;
  working_hours_end: string;
  auto_available: boolean;
}

interface StaffNotifications {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  task_reminders: boolean;
  daily_digest: boolean;
}

export function StaffSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [preferences, setPreferences] = useState<StaffPreferences>({
    preferred_reply_tone: "professional",
    default_response_length: "medium",
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    auto_available: true,
  });

  const [notifications, setNotifications] = useState<StaffNotifications>({
    email_notifications: true,
    whatsapp_notifications: false,
    task_reminders: true,
    daily_digest: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // For now, we'll use localStorage for staff preferences
      const savedPrefs = localStorage.getItem(`staff_prefs_${user.id}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (error) {
      console.error("Error fetching staff settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      localStorage.setItem(`staff_prefs_${user.id}`, JSON.stringify({
        preferences,
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences" className="gap-2">
            <Zap className="w-4 h-4" />
            AI Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* AI Usage Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage Preferences</CardTitle>
              <CardDescription>Customize how AI assists you within organizational limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="replyTone">Preferred Reply Tone</Label>
                  <Select
                    value={preferences.preferred_reply_tone}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, preferred_reply_tone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseLength">Default Response Length</Label>
                  <Select
                    value={preferences.default_response_length}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, default_response_length: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Working Hours Availability</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={preferences.working_hours_start}
                      onChange={(e) => setPreferences(prev => ({ ...prev, working_hours_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={preferences.working_hours_end}
                      onChange={(e) => setPreferences(prev => ({ ...prev, working_hours_end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Available During Working Hours</p>
                  <p className="text-sm text-muted-foreground">Automatically set status to available</p>
                </div>
                <Switch
                  checked={preferences.auto_available}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, auto_available: checked }))}
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
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email_notifications", label: "Email Notifications", desc: "Receive updates via email" },
                { key: "whatsapp_notifications", label: "WhatsApp Notifications", desc: "Get notifications on WhatsApp" },
                { key: "task_reminders", label: "Task Reminders", desc: "Remind about pending tasks" },
                { key: "daily_digest", label: "Daily Digest", desc: "Receive a daily summary" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={notifications[key as keyof StaffNotifications]}
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
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
