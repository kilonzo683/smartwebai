import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Route, Plus, Trash2, ArrowRight } from "lucide-react";

interface Channel {
  id: string;
  channel_type: string;
  name: string;
}

interface RoutingRule {
  id: string;
  channel_id: string;
  agent_type: string;
  priority: number;
  is_active: boolean;
  channel?: Channel;
}

const agentLabels: Record<string, string> = {
  secretary: "AI Secretary",
  support: "AI Support",
  social: "AI Social",
  lecturer: "AI Lecturer",
};

export function ChannelRouting() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newRule, setNewRule] = useState({
    channel_id: "",
    agent_type: "support",
    priority: 0,
  });

  const fetchData = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const [channelsRes, rulesRes] = await Promise.all([
        supabase
          .from("communication_channels")
          .select("id, channel_type, name")
          .eq("organization_id", currentOrg.id),
        supabase
          .from("channel_routing_rules")
          .select("*")
          .eq("organization_id", currentOrg.id)
          .order("priority", { ascending: true }),
      ]);

      if (channelsRes.error) throw channelsRes.error;
      if (rulesRes.error) throw rulesRes.error;

      setChannels((channelsRes.data as Channel[]) || []);
      
      // Enrich rules with channel data
      const enrichedRules = (rulesRes.data || []).map((rule) => ({
        ...rule,
        channel: channelsRes.data?.find((c) => c.id === rule.channel_id),
      })) as RoutingRule[];
      
      setRules(enrichedRules);
    } catch (error) {
      console.error("Error fetching routing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const createRule = async () => {
    if (!currentOrg || !newRule.channel_id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase.from("channel_routing_rules").insert([{
        organization_id: currentOrg.id,
        channel_id: newRule.channel_id,
        agent_type: newRule.agent_type,
        priority: newRule.priority,
        is_active: true,
      }]);

      if (error) throw error;

      toast({ title: "Routing rule created" });
      setNewRule({ channel_id: "", agent_type: "support", priority: 0 });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("channel_routing_rules")
        .update({ is_active: isActive })
        .eq("id", ruleId);

      if (error) throw error;

      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r))
      );
    } catch (error) {
      toast({ title: "Error", description: "Failed to update rule", variant: "destructive" });
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("channel_routing_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast({ title: "Rule deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete rule", variant: "destructive" });
    }
  };

  if (!currentOrg) {
    return (
      <Card className="glass">
        <CardContent className="text-center py-12 text-muted-foreground">
          <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an organization to manage routing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Channel Routing
          </CardTitle>
          <CardDescription>Route incoming messages to the appropriate AI agents</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={channels.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Routing Rule</DialogTitle>
              <DialogDescription>Route messages from a channel to an AI agent</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <Select
                  value={newRule.channel_id}
                  onValueChange={(v) => setNewRule((p) => ({ ...p, channel_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Route to Agent</label>
                <Select
                  value={newRule.agent_type}
                  onValueChange={(v) => setNewRule((p) => ({ ...p, agent_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">AI Customer Support</SelectItem>
                    <SelectItem value="secretary">AI Secretary</SelectItem>
                    <SelectItem value="social">AI Social Media</SelectItem>
                    <SelectItem value="lecturer">AI Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createRule} className="w-full" disabled={isSaving || !newRule.channel_id}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No channels configured</p>
            <p className="text-sm">Add channels first to create routing rules</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No routing rules defined</p>
            <p className="text-sm">Messages will use default handling</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="font-medium">{rule.channel?.name || "Unknown"}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {rule.channel?.channel_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Badge>{agentLabels[rule.agent_type] || rule.agent_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
