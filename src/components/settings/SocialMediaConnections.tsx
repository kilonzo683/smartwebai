import { useState, useEffect } from "react";
import { Facebook, Instagram, Linkedin, Twitter, Link2, Unlink, Check, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface SocialAccount {
  platform: string;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  connectedAt?: string;
  autoReply?: boolean;
  approvalRequired?: boolean;
}

interface SocialPlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}

const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Connect your Facebook Page to manage posts and messages",
    features: ["Post scheduling", "Page insights", "Messenger auto-reply"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    description: "Connect your Instagram Business account",
    features: ["Post scheduling", "Story insights", "DM management"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    description: "Connect your LinkedIn Company Page",
    features: ["Post scheduling", "Company insights", "Lead notifications"],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: Twitter,
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    description: "Connect your X account for posting and monitoring",
    features: ["Tweet scheduling", "Mention monitoring", "DM management"],
  },
];

export function SocialMediaConnections() {
  const { currentOrg } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Record<string, SocialAccount>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<string | null>(null);
  const [configDialog, setConfigDialog] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrg) {
      fetchConnections();
    }
  }, [currentOrg]);

  const fetchConnections = async () => {
    if (!currentOrg) return;

    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", currentOrg.id)
        .single();

      if (org?.settings) {
        const settings = org.settings as Record<string, unknown>;
        const socialAccounts = (settings.social_accounts || {}) as Record<string, SocialAccount>;
        setAccounts(socialAccounts);
      }
    } catch (error) {
      console.error("Error fetching social connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnections = async (updatedAccounts: Record<string, SocialAccount>) => {
    if (!currentOrg) return;

    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", currentOrg.id)
        .single();

      const currentSettings = (org?.settings || {}) as Record<string, unknown>;
      const newSettings = {
        ...currentSettings,
        social_accounts: updatedAccounts as unknown,
      } as unknown as Json;

      const { error } = await supabase
        .from("organizations")
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq("id", currentOrg.id);

      if (error) throw error;
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Error saving social connections:", error);
      throw error;
    }
  };

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);

    try {
      // Simulate OAuth flow - in production, this would redirect to the platform's OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedAccounts = {
        ...accounts,
        [platformId]: {
          platform: platformId,
          connected: true,
          accountName: `@${currentOrg?.name.toLowerCase().replace(/\s+/g, "")}`,
          accountId: `${platformId}_${Date.now()}`,
          connectedAt: new Date().toISOString(),
          autoReply: false,
          approvalRequired: true,
        },
      };

      await saveConnections(updatedAccounts);
      toast.success(`${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.name} connected successfully`);
    } catch (error) {
      toast.error("Failed to connect account");
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      const updatedAccounts = { ...accounts };
      delete updatedAccounts[platformId];
      await saveConnections(updatedAccounts);
      toast.success("Account disconnected");
      setDisconnectDialog(null);
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  };

  const handleUpdateSettings = async (platformId: string, settings: Partial<SocialAccount>) => {
    try {
      const updatedAccounts = {
        ...accounts,
        [platformId]: {
          ...accounts[platformId],
          ...settings,
        },
      };
      await saveConnections(updatedAccounts);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
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
          <p className="text-muted-foreground">Please select an organization to manage social connections.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Social Media Accounts</h3>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to enable AI-powered content management
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          To connect social media accounts, you'll need to set up OAuth apps on each platform's developer console.
          This allows secure authorization without sharing passwords.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => {
          const account = accounts[platform.id];
          const isConnected = account?.connected;
          const isConnecting = connectingPlatform === platform.id;
          const Icon = platform.icon;

          return (
            <Card key={platform.id} className={isConnected ? "border-primary/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.bgColor}`}>
                      <Icon className={`w-5 h-5 ${platform.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {platform.name}
                        {isConnected && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                            <Check className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {platform.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Account</span>
                        <span className="font-medium">{account.accountName}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Connected</span>
                        <span className="text-xs">{new Date(account.connectedAt || "").toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Auto-Reply</p>
                          <p className="text-xs text-muted-foreground">AI responds to messages automatically</p>
                        </div>
                        <Switch
                          checked={account.autoReply}
                          onCheckedChange={(checked) => handleUpdateSettings(platform.id, { autoReply: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Require Approval</p>
                          <p className="text-xs text-muted-foreground">Posts need approval before publishing</p>
                        </div>
                        <Switch
                          checked={account.approvalRequired}
                          onCheckedChange={(checked) => handleUpdateSettings(platform.id, { approvalRequired: checked })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setConfigDialog(platform.id)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDisconnectDialog(platform.id)}
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Features:</p>
                      <ul className="text-xs space-y-1">
                        {platform.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect {platform.name}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this social media account? 
              You'll need to reconnect it to resume posting and monitoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => disconnectDialog && handleDisconnect(disconnectDialog)}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {configDialog && SOCIAL_PLATFORMS.find(p => p.id === configDialog)?.name} Settings
            </DialogTitle>
            <DialogDescription>
              Configure how the AI agent interacts with this account
            </DialogDescription>
          </DialogHeader>
          {configDialog && accounts[configDialog] && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Connected Account</Label>
                <Input value={accounts[configDialog].accountName || ""} disabled />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-Reply to Messages</p>
                    <p className="text-sm text-muted-foreground">
                      AI automatically responds to incoming messages
                    </p>
                  </div>
                  <Switch
                    checked={accounts[configDialog].autoReply}
                    onCheckedChange={(checked) => {
                      handleUpdateSettings(configDialog, { autoReply: checked });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Require Post Approval</p>
                    <p className="text-sm text-muted-foreground">
                      All AI-generated posts require manual approval
                    </p>
                  </div>
                  <Switch
                    checked={accounts[configDialog].approvalRequired}
                    onCheckedChange={(checked) => {
                      handleUpdateSettings(configDialog, { approvalRequired: checked });
                    }}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  For advanced settings like posting permissions and API configuration, 
                  visit the platform's developer console.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setConfigDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
