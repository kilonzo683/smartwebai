import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Mail, Phone, Globe, Plus, Settings, Trash2 } from "lucide-react";

interface Channel {
  id: string;
  channel_type: string;
  name: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <Phone className="w-5 h-5 text-green-500" />,
  email: <Mail className="w-5 h-5 text-blue-500" />,
  webchat: <Globe className="w-5 h-5 text-purple-500" />,
  sms: <MessageSquare className="w-5 h-5 text-orange-500" />,
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  webchat: "Web Chat",
  sms: "SMS",
};

export function ChannelManager() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newChannel, setNewChannel] = useState({
    channel_type: "webchat",
    name: "",
  });

  const fetchChannels = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("communication_channels")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChannels((data as Channel[]) || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [currentOrg]);

  const createChannel = async () => {
    if (!currentOrg || !newChannel.name.trim()) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from("communication_channels").insert([{
        organization_id: currentOrg.id,
        channel_type: newChannel.channel_type,
        name: newChannel.name,
        is_enabled: true,
        config: getDefaultConfig(newChannel.channel_type),
      }]);

      if (error) throw error;

      toast({ title: "Channel created", description: `${newChannel.name} has been added` });
      setNewChannel({ channel_type: "webchat", name: "" });
      setDialogOpen(false);
      fetchChannels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "webchat":
        return { widget_color: "#8b5cf6", position: "bottom-right", greeting: "Hello! How can I help you?" };
      case "email":
        return { smtp_host: "", smtp_port: 587, from_email: "" };
      case "whatsapp":
        return { phone_number: "", api_key: "" };
      default:
        return {};
    }
  };

  const toggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("communication_channels")
        .update({ is_enabled: enabled })
        .eq("id", channelId);

      if (error) throw error;

      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, is_enabled: enabled } : c))
      );

      toast({ title: enabled ? "Channel enabled" : "Channel disabled" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update channel", variant: "destructive" });
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from("communication_channels")
        .delete()
        .eq("id", channelId);

      if (error) throw error;

      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      toast({ title: "Channel deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete channel", variant: "destructive" });
    }
  };

  if (!currentOrg) {
    return (
      <Card className="glass">
        <CardContent className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an organization to manage channels</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication Channels
          </CardTitle>
          <CardDescription>Manage your customer communication channels</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Communication Channel</DialogTitle>
              <DialogDescription>Set up a new channel for customer interactions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Channel Type</Label>
                <Select
                  value={newChannel.channel_type}
                  onValueChange={(v) => setNewChannel((p) => ({ ...p, channel_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webchat">Web Chat Widget</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel Name</Label>
                <Input
                  placeholder="e.g., Website Support Chat"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <Button onClick={createChannel} className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Channel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{channels.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-500">
              {channels.filter((c) => c.is_enabled).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 text-center">
            <p className="text-2xl font-bold text-purple-500">
              {channels.filter((c) => c.channel_type === "webchat").length}
            </p>
            <p className="text-xs text-muted-foreground">Web Chat</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {channels.filter((c) => c.channel_type === "email").length}
            </p>
            <p className="text-xs text-muted-foreground">Email</p>
          </div>
        </div>

        {/* Channel List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No channels configured</p>
            <p className="text-sm">Add your first communication channel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  channel.is_enabled ? "bg-accent/20" : "bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background">
                    {channelIcons[channel.channel_type]}
                  </div>
                  <div>
                    <h4 className="font-medium">{channel.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {channelLabels[channel.channel_type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Added {new Date(channel.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={channel.is_enabled}
                    onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                  />
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteChannel(channel.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
