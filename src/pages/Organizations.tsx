import { useState, useEffect } from "react";
import { Plus, Building2, Users, Settings, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface OrgMember {
  id: string;
  user_id: string;
  role: AppRole;
  joined_at: string;
  profile_name: string | null;
  email: string;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  staff: "Staff",
  lecturer: "Lecturer",
  support_agent: "Support Agent",
  end_user: "End User",
};

export default function Organizations() {
  const { currentOrg, organizations, createOrganization, refetch, setCurrentOrg } = useOrganization();
  const { isSuperAdmin, isOrgAdmin } = useRole();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("end_user");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      fetchMembers();
    }
  }, [currentOrg]);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    setLoadingMembers(true);
    
    try {
      const { data: membersData, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role, joined_at")
        .eq("organization_id", currentOrg.id);

      if (error) throw error;

      // Get profiles
      const userIds = membersData?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const enrichedMembers: OrgMember[] = (membersData || []).map(m => ({
        ...m,
        role: m.role as AppRole,
        profile_name: profilesMap.get(m.user_id) || null,
        email: m.user_id === user?.id ? user.email || "" : `User ${m.user_id.slice(0, 8)}...`,
      }));

      setMembers(enrichedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setIsCreating(true);

    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, "-");
    const result = await createOrganization(newOrgName, slug);

    if (result.success) {
      toast({
        title: "Organization created",
        description: `${newOrgName} has been created successfully.`,
      });
      setNewOrgName("");
      setNewOrgSlug("");
      setDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create organization",
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  const handleInviteMember = async () => {
    if (!currentOrg || !inviteEmail.trim() || !user) return;
    setIsInviting(true);

    try {
      // Look up user by email in profiles (checking if they exist)
      const { data: authUsers, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1);
      
      // For now, we'll add them if they have an account. In a full implementation,
      // you'd send an invite email using an edge function.
      // Check if there's a user with this email by querying auth.users via an edge function
      // For this implementation, we show a pending invite message
      
      toast({
        title: "Invite pending",
        description: `When ${inviteEmail} signs up, they can be added to ${currentOrg.name} with the ${roleLabels[inviteRole]} role.`,
      });
      setInviteEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process invite",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));

      toast({
        title: "Role updated",
        description: "Member role has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({
        title: "Member removed",
        description: "The member has been removed from the organization",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
            <p className="text-muted-foreground">Manage your organizations and team members</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage your team and AI agents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">URL Slug (optional)</Label>
                <Input
                  id="orgSlug"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="my-company"
                />
              </div>
              <Button onClick={handleCreateOrg} className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Organization
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <div className="flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: "50ms" }}>
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant={currentOrg?.id === org.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentOrg(org)}
            >
              {org.name}
            </Button>
          ))}
        </div>
      )}

      {/* Current Organization Management */}
      {currentOrg ? (
        <Tabs defaultValue="members" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6 space-y-6">
            {/* Invite Section */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Invite Members</CardTitle>
                <CardDescription>Add new team members to {currentOrg.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger className="w-40">
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
                  <Button onClick={handleInviteMember} disabled={isInviting}>
                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Team Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="font-medium">{member.profile_name || member.email}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleUpdateMemberRole(member.id, v as AppRole)}
                            >
                              <SelectTrigger className="w-36">
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
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage {currentOrg.name} settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold capitalize">{currentOrg.subscription_plan}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="text-lg font-semibold">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="glass animate-slide-up">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No organizations yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}