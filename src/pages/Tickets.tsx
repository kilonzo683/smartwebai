import { useState, useEffect } from "react";
import { Ticket, Plus, Loader2, MessageSquare, Clock, AlertCircle, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketData {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  escalated_by: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  open: { label: "Open", color: "bg-blue-500", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-yellow-500", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-500", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-gray-500", icon: CheckCircle2 },
};

const priorityConfig: Record<TicketPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "outline" },
  medium: { label: "Medium", variant: "secondary" },
  high: { label: "High", variant: "default" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export default function Tickets() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [activeTab, setActiveTab] = useState<TicketStatus | "all">("all");

  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
  });

  useEffect(() => {
    fetchTickets();
  }, [currentOrg]);

  const fetchTickets = async () => {
    if (!currentOrg) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("escalation_tickets")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data as TicketData[]) || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!currentOrg || !user || !newTicket.title.trim()) return;
    setIsCreating(true);

    try {
      const { error } = await supabase.from("escalation_tickets").insert({
        organization_id: currentOrg.id,
        title: newTicket.title,
        description: newTicket.description || null,
        priority: newTicket.priority,
        escalated_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted.",
      });

      setNewTicket({ title: "", description: "", priority: "medium" });
      setDialogOpen(false);
      fetchTickets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "resolved") {
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("escalation_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: newStatus } : t
      ));

      toast({
        title: "Status updated",
        description: `Ticket marked as ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("escalation_tickets")
        .update({ assigned_to: user.id, status: "in_progress" })
        .eq("id", ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, assigned_to: user.id, status: "in_progress" } : t
      ));

      toast({
        title: "Ticket assigned",
        description: "Ticket has been assigned to you",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    }
  };

  const filteredTickets = activeTab === "all" 
    ? tickets 
    : tickets.filter(t => t.status === activeTab);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    total: tickets.length,
  };

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please select or create an organization first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground">Manage escalated conversations and support requests</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Submit a new support request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide more details..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(v) => setNewTicket(prev => ({ ...prev, priority: v as TicketPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTicket} className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Resolved</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card className="glass animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TicketStatus | "all")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const StatusIcon = statusConfig[ticket.status].icon;
                return (
                  <div
                    key={ticket.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${statusConfig[ticket.status].color}/20 flex items-center justify-center`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig[ticket.status].color.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-foreground">{ticket.title}</h4>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={priorityConfig[ticket.priority].variant}>
                          {priorityConfig[ticket.priority].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </span>
                        {ticket.assigned_to && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {ticket.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => handleAssignToMe(ticket.id)}>
                          Take
                        </Button>
                      )}
                      {ticket.status === "in_progress" && (
                        <Button size="sm" onClick={() => handleUpdateStatus(ticket.id, "resolved")}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}