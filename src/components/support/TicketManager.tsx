import { useState, useEffect, useCallback } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Plus, 
  ArrowUpCircle,
  MessageSquare,
  Loader2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  escalated_by: string;
  resolved_at: string | null;
}

interface TicketManagerProps {
  onEscalate?: (ticketId: string) => void;
  onTakeover?: (ticketId: string) => void;
  refreshKey?: number;
}

export function TicketManager({ onEscalate, onTakeover, refreshKey }: TicketManagerProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    tags: ""
  });
  const { currentOrg } = useOrganization();

  const fetchTickets = useCallback(async () => {
    if (!currentOrg) return;
    
    try {
      const { data, error } = await supabase
        .from("escalation_tickets")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, refreshKey]);

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !currentOrg) return;

    setIsCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const tags = newTicket.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase
        .from("escalation_tickets")
        .insert({
          organization_id: currentOrg.id,
          title: newTicket.title,
          description: newTicket.description || null,
          priority: newTicket.priority,
          tags: tags.length > 0 ? tags : null,
          escalated_by: session.session.user.id,
        });

      if (error) throw error;

      toast({ title: "Ticket created", description: "New support ticket has been created" });
      setShowCreateDialog(false);
      setNewTicket({ title: "", description: "", priority: "medium", tags: "" });
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === "resolved") {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = session.session?.user.id;
      }

      const { error } = await supabase
        .from("escalation_tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;
      
      toast({ title: "Status updated", description: `Ticket marked as ${newStatus}` });
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleTakeover = async (ticketId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { error } = await supabase
        .from("escalation_tickets")
        .update({ 
          assigned_to: session.session.user.id,
          status: "in_progress" as TicketStatus
        })
        .eq("id", ticketId);

      if (error) throw error;
      
      toast({ title: "Ticket assigned", description: "You are now handling this ticket" });
      onTakeover?.(ticketId);
      fetchTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error taking over ticket:", error);
      toast({ title: "Error", description: "Failed to assign ticket", variant: "destructive" });
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "open": return <Clock className="w-4 h-4 text-blue-400" />;
      case "in_progress": return <ArrowUpCircle className="w-4 h-4 text-yellow-400" />;
      case "resolved": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "closed": return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");

  return (
    <>
      <div className="glass rounded-2xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-agent-support" />
            <h3 className="text-sm font-medium">Ticket Queue</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>

        {openTickets.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No open tickets</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {openTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm font-medium truncate">{ticket.title}</span>
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </Badge>
                      {ticket.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Brief description of the issue"
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Detailed description..."
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags (comma-separated)</label>
              <Input
                placeholder="billing, technical, feature-request"
                value={newTicket.tags}
                onChange={(e) => setNewTicket(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={isCreating || !newTicket.title.trim()}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket && getStatusIcon(selectedTicket.status)}
              {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority} priority
                </Badge>
                <Badge variant="secondary">{selectedTicket.status}</Badge>
              </div>

              {selectedTicket.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{selectedTicket.description}</p>
                </div>
              )}

              {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTicket.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {formatDate(selectedTicket.created_at)}
                {selectedTicket.resolved_at && (
                  <> • Resolved: {formatDate(selectedTicket.resolved_at)}</>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selectedTicket.status === "open" && (
                  <Button
                    size="sm"
                    onClick={() => handleTakeover(selectedTicket.id)}
                  >
                    <User className="w-4 h-4 mr-1" />
                    Take Over
                  </Button>
                )}
                {selectedTicket.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark Resolved
                  </Button>
                )}
                {(selectedTicket.status === "open" || selectedTicket.status === "in_progress") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onEscalate?.(selectedTicket.id);
                      setSelectedTicket(null);
                    }}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                    Escalate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
