import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Mail, UserPlus, Clock, CheckCircle, XCircle, Copy, RefreshCw, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  staff: "Staff",
  lecturer: "Lecturer",
  support_agent: "Support Agent",
  end_user: "End User",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  expired: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  accepted: <CheckCircle className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

export function InvitationManager() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "end_user" as AppRole,
  });

  const fetchInvitations = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations((data as Invitation[]) || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentOrg]);

  const sendInvitation = async () => {
    if (!currentOrg || !user || !inviteForm.email.trim()) return;
    setIsInviting(true);

    try {
      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from("organization_invitations")
        .insert({
          organization_id: currentOrg.id,
          email: inviteForm.email.toLowerCase().trim(),
          role: inviteForm.role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Log the activity
      await supabase.from("audit_log").insert({
        user_id: user.id,
        organization_id: currentOrg.id,
        action: "invite",
        resource_type: "invitation",
        resource_id: invitation.id,
        entity_name: inviteForm.email,
        details: { role: inviteForm.role },
      });

      // Try to send email via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
          body: {
            email: inviteForm.email,
            organizationName: currentOrg.name,
            role: roleLabels[inviteForm.role],
            inviteLink: `${window.location.origin}/accept-invite?token=${invitation.token}`,
          },
        });

        if (emailError) {
          console.error("Email sending failed:", emailError);
          toast({
            title: "Invitation created",
            description: "Invitation created but email could not be sent. Share the invite link manually.",
          });
        } else {
          toast({
            title: "Invitation sent",
            description: `Invitation email sent to ${inviteForm.email}`,
          });
        }
      } catch {
        toast({
          title: "Invitation created",
          description: "Share the invite link with the user manually.",
        });
      }

      setInviteForm({ email: "", role: "end_user" });
      setDialogOpen(false);
      fetchInvitations();
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("organization_invitations")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "cancelled" } : inv))
      );

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const resendInvitation = async (invitation: Invitation) => {
    try {
      // Update expiry
      const { error: updateError } = await supabase
        .from("organization_invitations")
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // Try to resend email
      try {
        await supabase.functions.invoke("send-invitation-email", {
          body: {
            email: invitation.email,
            organizationName: currentOrg?.name,
            role: roleLabels[invitation.role],
            inviteLink: `${window.location.origin}/accept-invite?token=${invitation.token}`,
          },
        });
      } catch {
        // Email failed but invitation is updated
      }

      toast({
        title: "Invitation resent",
        description: `Invitation resent to ${invitation.email}`,
      });

      fetchInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;

  if (!currentOrg) {
    return (
      <Card className="glass">
        <CardContent className="text-center py-12 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an organization to manage invitations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            User Invitations
          </CardTitle>
          <CardDescription>
            Invite new members to join {currentOrg.name}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {currentOrg.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(v) => setInviteForm((prev) => ({ ...prev, role: v as AppRole }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_user">End User</SelectItem>
                    <SelectItem value="support_agent">Support Agent</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="org_admin">Org Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={sendInvitation} className="w-full" disabled={isInviting}>
                {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{invitations.length}</p>
            <p className="text-xs text-muted-foreground">Total Invites</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-500">{acceptedCount}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
        </div>

        {/* Invitations List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No invitations sent yet</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[invitation.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[invitation.status]}>
                        {statusIcons[invitation.status]}
                        <span className="ml-1 capitalize">{invitation.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invitation.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyInviteLink(invitation.token)}
                              title="Copy invite link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resendInvitation(invitation)}
                              title="Resend invitation"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => cancelInvitation(invitation.id)}
                              title="Cancel invitation"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {(invitation.status === "expired" || invitation.status === "cancelled") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => resendInvitation(invitation)}
                            title="Resend invitation"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
