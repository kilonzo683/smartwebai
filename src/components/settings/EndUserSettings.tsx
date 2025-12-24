import { useState, useEffect } from "react";
import { Bell, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EndUserNotifications {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  marketing_emails: boolean;
}

export function EndUserSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [notifications, setNotifications] = useState<EndUserNotifications>({
    email_notifications: true,
    whatsapp_notifications: false,
    marketing_emails: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const savedPrefs = localStorage.getItem(`enduser_prefs_${user.id}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      localStorage.setItem(`enduser_prefs_${user.id}`, JSON.stringify({
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email_notifications", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "whatsapp_notifications", label: "WhatsApp Notifications", desc: "Get notifications on WhatsApp" },
            { key: "marketing_emails", label: "Marketing Emails", desc: "Receive promotional content and offers" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifications[key as keyof EndUserNotifications]}
                onCheckedChange={(checked) =>
                  setNotifications(prev => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
