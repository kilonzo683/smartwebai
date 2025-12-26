import { useState, useEffect, useRef } from "react";
import { 
  User, Bell, Shield, Palette, Moon, Sun, LogOut, Loader2, Save, Camera,
  Building2, Globe, Settings2, Key, Lock, Smartphone, History, Download, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";

type SettingsLevel = "system" | "organization" | "user";

export default function Settings() {
  const { user } = useAuth();
  const { userRole, isSuperAdmin, isOrgAdmin, isLoading: roleLoading } = useRole();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string; phone: string }>({
    full_name: "",
    avatar_url: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [activeLevel, setActiveLevel] = useState<SettingsLevel>("user");
  
  // User preferences
  const [userPreferences, setUserPreferences] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    notifications: {
      email: true,
      push: false,
      weekly: true,
    },
  });

  // User security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    showPassword: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // AI personalization
  const [aiSettings, setAiSettings] = useState({
    writingTone: "professional",
    aiMemoryEnabled: true,
    savedPrompts: [] as string[],
    historyVisible: true,
  });

  const [usageStats, setUsageStats] = useState({
    messages: 0,
    documents: 0,
    quizzes: 0,
    conversations: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Load saved user preferences
    const savedPrefs = localStorage.getItem("user_preferences");
    if (savedPrefs) {
      setUserPreferences(JSON.parse(savedPrefs));
    }

    const savedAiSettings = localStorage.getItem("ai_settings");
    if (savedAiSettings) {
      setAiSettings(JSON.parse(savedAiSettings));
    }

    // Set default active level based on role
    if (isSuperAdmin) {
      setActiveLevel("system");
    } else if (isOrgAdmin) {
      setActiveLevel("organization");
    } else {
      setActiveLevel("user");
    }

    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            avatar_url: profileData.avatar_url || "",
            phone: "",
          });
        }

        const [conversationsRes, lectureDocsRes, supportDocsRes, quizzesRes] = await Promise.all([
          supabase.from("conversations").select("id").eq("user_id", user.id),
          supabase.from("lecture_documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("support_documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        const conversationIds = conversationsRes.data?.map(c => c.id) || [];
        let messageCount = 0;
        if (conversationIds.length > 0) {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", conversationIds);
          messageCount = count || 0;
        }

        setUsageStats({
          conversations: conversationsRes.data?.length || 0,
          documents: (lectureDocsRes.count || 0) + (supportDocsRes.count || 0),
          quizzes: quizzesRes.count || 0,
          messages: messageCount,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, isSuperAdmin, isOrgAdmin]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          full_name: profile.full_name,
        }, { onConflict: "user_id" });

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAiSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("ai_settings", JSON.stringify(aiSettings));
      toast({
        title: "AI settings saved",
        description: "Your AI personalization settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: securitySettings.newPassword,
      });

      if (error) throw error;

      setSecuritySettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
  };

  const handleDownloadData = async () => {
    toast({
      title: "Preparing download",
      description: "Your personal data is being prepared for download.",
    });
    // In a real implementation, this would trigger an export of user data
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleBadge = () => {
    const roleLabels: Record<string, { label: string; color: string }> = {
      super_admin: { label: "Super Admin", color: "bg-red-500/20 text-red-400" },
      org_admin: { label: "Org Admin", color: "bg-purple-500/20 text-purple-400" },
      staff: { label: "Staff", color: "bg-blue-500/20 text-blue-400" },
      lecturer: { label: "Lecturer", color: "bg-green-500/20 text-green-400" },
      support_agent: { label: "Support Agent", color: "bg-orange-500/20 text-orange-400" },
      end_user: { label: "User", color: "bg-gray-500/20 text-gray-400" },
    };
    const role = roleLabels[userRole || "end_user"];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
        {role.label}
      </span>
    );
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, organization, and platform settings
            </p>
          </div>
          {getRoleBadge()}
        </div>
      </div>

      {/* Settings Level Selector */}
      <div className="flex gap-2 flex-wrap">
        {isSuperAdmin && (
          <Button
            variant={activeLevel === "system" ? "default" : "outline"}
            onClick={() => setActiveLevel("system")}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            System Settings
          </Button>
        )}
        {(isSuperAdmin || isOrgAdmin) && (
          <Button
            variant={activeLevel === "organization" ? "default" : "outline"}
            onClick={() => setActiveLevel("organization")}
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            Organization Settings
          </Button>
        )}
        <Button
          variant={activeLevel === "user" ? "default" : "outline"}
          onClick={() => setActiveLevel("user")}
          className="gap-2"
        >
          <User className="w-4 h-4" />
          User Settings
        </Button>
      </div>

      <Separator />

      {/* System Settings - Super Admin Only */}
      {activeLevel === "system" && isSuperAdmin && (
        <div className="animate-slide-up">
          <SystemSettings />
        </div>
      )}

      {/* Organization Settings - Org Admin */}
      {activeLevel === "organization" && (isSuperAdmin || isOrgAdmin) && (
        <div className="animate-slide-up">
          <OrganizationSettings />
        </div>
      )}

      {/* User Settings - All Users */}
      {activeLevel === "user" && (
        <div className="animate-slide-up space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user ? (
                    <>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={profile.avatar_url} alt={profile.full_name || user.email || ""} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                              {getInitials(profile.full_name, user.email || "")}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Profile Picture</p>
                          <p className="text-sm text-muted-foreground">
                            Click the camera icon to upload a new photo
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max size: 5MB. Supported formats: JPG, PNG, GIF
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user.email || ""}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profile.full_name}
                            onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Sign in to manage your profile
                      </p>
                      <Button onClick={() => navigate("/auth")}>
                        Sign In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your language, timezone, and display preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={userPreferences.language}
                        onValueChange={(value) => setUserPreferences(prev => ({ ...prev, language: value }))}
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
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={userPreferences.timezone}
                        onValueChange={(value) => setUserPreferences(prev => ({ ...prev, timezone: value }))}
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
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={userPreferences.dateFormat}
                        onValueChange={(value) => setUserPreferences(prev => ({ ...prev, dateFormat: value }))}
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

                  <Button onClick={handleSavePreferences} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the app looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Theme</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleThemeChange("light")}
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleThemeChange("dark")}
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      checked={userPreferences.notifications.email}
                      onCheckedChange={(checked) =>
                        setUserPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive browser notifications
                      </p>
                    </div>
                    <Switch
                      checked={userPreferences.notifications.push}
                      onCheckedChange={(checked) =>
                        setUserPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, push: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly activity digest
                      </p>
                    </div>
                    <Switch
                      checked={userPreferences.notifications.weekly}
                      onCheckedChange={(checked) =>
                        setUserPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, weekly: checked },
                        }))
                      }
                    />
                  </div>

                  <Button onClick={handleSavePreferences} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={securitySettings.showPassword ? "text" : "password"}
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setSecuritySettings(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {securitySettings.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={securitySettings.showPassword ? "text" : "password"}
                      value={securitySettings.confirmPassword}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button onClick={handleChangePassword} disabled={isSaving || !securitySettings.newPassword}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Use an authenticator app for additional security
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                  <CardDescription>
                    Manage your data and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user && (
                    <div className="p-4 rounded-lg bg-accent/30">
                      <p className="font-medium mb-1">Account Status</p>
                      <p className="text-sm text-muted-foreground">
                        Signed in as <span className="font-medium text-foreground">{user.email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sign in: {new Date(user.last_sign_in_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 flex-wrap">
                    <Button variant="outline" onClick={handleDownloadData}>
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>
                    <Button variant="destructive" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Personalization Tab */}
            <TabsContent value="ai" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Personalization</CardTitle>
                  <CardDescription>
                    Customize how AI agents interact with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="writingTone">Default Writing Tone</Label>
                    <Select
                      value={aiSettings.writingTone}
                      onValueChange={(value) => setAiSettings(prev => ({ ...prev, writingTone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">AI Memory</p>
                      <p className="text-sm text-muted-foreground">
                        Allow AI to remember context from previous conversations
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.aiMemoryEnabled}
                      onCheckedChange={(checked) =>
                        setAiSettings(prev => ({ ...prev, aiMemoryEnabled: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Show Conversation History</p>
                      <p className="text-sm text-muted-foreground">
                        Display your past AI conversations
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.historyVisible}
                      onCheckedChange={(checked) =>
                        setAiSettings(prev => ({ ...prev, historyVisible: checked }))
                      }
                    />
                  </div>

                  <Button onClick={handleSaveAiSettings} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save AI Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Your activity summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-accent/30">
                  <p className="text-2xl font-bold text-foreground">{usageStats.conversations}</p>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/30">
                  <p className="text-2xl font-bold text-foreground">{usageStats.documents}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/30">
                  <p className="text-2xl font-bold text-foreground">{usageStats.quizzes}</p>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/30">
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-xs text-muted-foreground">AI Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
