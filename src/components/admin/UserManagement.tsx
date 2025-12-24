import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: AppRole;
  profile_name: string | null;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  staff: "Staff",
  lecturer: "Lecturer",
  support_agent: "Support Agent",
  end_user: "End User",
};

export function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Get profiles for user names
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p.full_name])
      );

      // Get current user for email display
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const usersMap = new Map<string, UserWithRole>();
      
      for (const roleData of rolesData || []) {
        const userId = roleData.user_id;
        
        usersMap.set(userId, {
          id: userId,
          email: userId === currentUser?.id ? currentUser.email || "Unknown" : `User ${userId.slice(0, 8)}...`,
          created_at: new Date().toISOString(),
          last_sign_in_at: null,
          role: roleData.role as AppRole,
          profile_name: profilesMap.get(userId) || null,
        });
      }

      setUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role updated",
        description: `User role changed to ${roleLabels[newRole]}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "org_admin":
        return "default";
      case "staff":
      case "lecturer":
      case "support_agent":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{users.filter(u => u.role === "super_admin" || u.role === "org_admin").length}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{users.filter(u => u.role === "staff" || u.role === "lecturer" || u.role === "support_agent").length}</p>
            <p className="text-xs text-muted-foreground">Staff</p>
          </div>
        </div>

        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.profile_name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-36">
                          {updatingUserId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="end_user">End User</SelectItem>
                          <SelectItem value="support_agent">Support Agent</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="org_admin">Org Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
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