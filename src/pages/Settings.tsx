import { useState, useEffect, useRef } from "react";
import { User, Bell, Shield, Palette, Moon, Sun, LogOut, Loader2, Save, Camera, Building2, Globe, GraduationCap, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { PlatformSettings } from "@/components/settings/PlatformSettings";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { StaffSettings } from "@/components/settings/StaffSettings";
import { LecturerSettings } from "@/components/settings/LecturerSettings";
import { SupportAgentSettings } from "@/components/settings/SupportAgentSettings";
import { EndUserSettings } from "@/components/settings/EndUserSettings";

export default function Settings() {
  const { user } = useAuth();
  const { userRole, isSuperAdmin, isOrgAdmin, isStaff, isLecturer, isSupportAgent, isLoading: roleLoading } = useRole();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string }>({
    full_name: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
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
  }, [user]);

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

  // Determine which tabs to show based on role
  const getTabs = () => {
    const tabs = [
      { id: "profile", label: "Profile", icon: User, show: true },
      { id: "appearance", label: "Appearance", icon: Palette, show: true },
    ];

    // Super Admin - Platform Settings
    if (isSuperAdmin) {
      tabs.push({ id: "platform", label: "Platform", icon: Globe, show: true });
    }

    // Org Admin - Organization Settings
    if (isOrgAdmin) {
      tabs.push({ id: "organization", label: "Organization", icon: Building2, show: true });
    }

    // Staff - Staff Settings
    if (isStaff && !isOrgAdmin && !isSuperAdmin) {
      tabs.push({ id: "staff", label: "Preferences", icon: User, show: true });
    }

    // Lecturer - Teaching Settings
    if (isLecturer) {
      tabs.push({ id: "lecturer", label: "Teaching", icon: GraduationCap, show: true });
    }

    // Support Agent - Support Settings
    if (isSupportAgent) {
      tabs.push({ id: "support", label: "Support", icon: Headphones, show: true });
    }

    // End User - Minimal Settings
    if (userRole === "end_user") {
      tabs.push({ id: "enduser", label: "Preferences", icon: Bell, show: true });
    }

    // Common tabs for all
    tabs.push({ id: "notifications", label: "Notifications", icon: Bell, show: true });
    tabs.push({ id: "security", label: "Security", icon: Shield, show: true });

    return tabs.filter(t => t.show);
  };

  const tabs = getTabs();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>
          {getRoleBadge()}
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab - All Users */}
        <TabsContent value="profile" className="mt-6">
          <Card className="glass">
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

        {/* Appearance Tab - All Users */}
        <TabsContent value="appearance" className="mt-6">
          <Card className="glass">
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

        {/* Platform Settings - Super Admin Only */}
        {isSuperAdmin && (
          <TabsContent value="platform" className="mt-6">
            <PlatformSettings />
          </TabsContent>
        )}

        {/* Organization Settings - Org Admin */}
        {isOrgAdmin && (
          <TabsContent value="organization" className="mt-6">
            <OrganizationSettings />
          </TabsContent>
        )}

        {/* Staff Settings */}
        {isStaff && !isOrgAdmin && !isSuperAdmin && (
          <TabsContent value="staff" className="mt-6">
            <StaffSettings />
          </TabsContent>
        )}

        {/* Lecturer Settings */}
        {isLecturer && (
          <TabsContent value="lecturer" className="mt-6">
            <LecturerSettings />
          </TabsContent>
        )}

        {/* Support Agent Settings */}
        {isSupportAgent && (
          <TabsContent value="support" className="mt-6">
            <SupportAgentSettings />
          </TabsContent>
        )}

        {/* End User Settings */}
        {userRole === "end_user" && (
          <TabsContent value="enduser" className="mt-6">
            <EndUserSettings />
          </TabsContent>
        )}

        {/* Notifications Tab - All Users */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive browser notifications
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Summary</p>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly activity digest
                  </p>
                </div>
                <Switch
                  checked={notifications.weekly}
                  onCheckedChange={(checked) =>
                    setNotifications(prev => ({ ...prev, weekly: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab - All Users */}
        <TabsContent value="security" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user ? (
                <>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="font-medium mb-1">Account Status</p>
                    <p className="text-sm text-muted-foreground">
                      Signed in as <span className="font-medium text-foreground">{user.email}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sign in: {new Date(user.last_sign_in_at || "").toLocaleDateString()}
                    </p>
                  </div>

                  <Button variant="destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Sign in to manage security settings
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Stats - All Users */}
      <Card className="glass animate-slide-up" style={{ animationDelay: "200ms" }}>
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
  );
}
