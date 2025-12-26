import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  Users, 
  Crown, 
  Building2, 
  UserCog, 
  GraduationCap, 
  Headphones, 
  User,
  Loader2,
  Search,
  RefreshCw,
  Check,
  X,
  Key,
  Lock,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface UserWithRole {
  id: string;
  email: string;
  role: AppRole;
  profile_name: string | null;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  staff: "Staff",
  lecturer: "Lecturer",
  support_agent: "Support Agent",
  end_user: "End User",
};

const roleDescriptions: Record<AppRole, string> = {
  super_admin: "Full platform access with all permissions",
  org_admin: "Manage organization settings, users, and agents",
  staff: "Access to secretary agent and basic features",
  lecturer: "Access to lecturer agent and quiz management",
  support_agent: "Handle support tickets and escalations",
  end_user: "Basic access to assigned features",
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  super_admin: <Crown className="w-4 h-4" />,
  org_admin: <Building2 className="w-4 h-4" />,
  staff: <UserCog className="w-4 h-4" />,
  lecturer: <GraduationCap className="w-4 h-4" />,
  support_agent: <Headphones className="w-4 h-4" />,
  end_user: <User className="w-4 h-4" />,
};

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-destructive text-destructive-foreground",
  org_admin: "bg-primary text-primary-foreground",
  staff: "bg-secondary text-secondary-foreground",
  lecturer: "bg-accent text-accent-foreground",
  support_agent: "bg-muted text-muted-foreground",
  end_user: "bg-background text-foreground border",
};

// Define all system permissions
const systemPermissions: Permission[] = [
  // Platform Management
  { id: "platform.settings", name: "Platform Settings", description: "Configure platform-wide settings", category: "Platform" },
  { id: "platform.branding", name: "Platform Branding", description: "Manage platform branding and white-label", category: "Platform" },
  { id: "platform.plans", name: "Subscription Plans", description: "Create and manage subscription plans", category: "Platform" },
  { id: "platform.maintenance", name: "Maintenance Mode", description: "Toggle platform maintenance mode", category: "Platform" },
  
  // Organization Management
  { id: "org.create", name: "Create Organizations", description: "Create new organizations", category: "Organization" },
  { id: "org.settings", name: "Organization Settings", description: "Manage organization settings", category: "Organization" },
  { id: "org.billing", name: "Billing Management", description: "Manage billing and subscriptions", category: "Organization" },
  { id: "org.members", name: "Member Management", description: "Add and remove organization members", category: "Organization" },
  
  // User Management
  { id: "users.view", name: "View Users", description: "View all users in the system", category: "Users" },
  { id: "users.create", name: "Create Users", description: "Create new user accounts", category: "Users" },
  { id: "users.edit", name: "Edit Users", description: "Modify user information", category: "Users" },
  { id: "users.delete", name: "Delete Users", description: "Remove users from the system", category: "Users" },
  { id: "users.roles", name: "Manage Roles", description: "Assign and modify user roles", category: "Users" },
  
  // Agent Access
  { id: "agents.secretary", name: "Secretary Agent", description: "Access to AI secretary features", category: "Agents" },
  { id: "agents.support", name: "Support Agent", description: "Access to AI support features", category: "Agents" },
  { id: "agents.social", name: "Social Agent", description: "Access to AI social media features", category: "Agents" },
  { id: "agents.lecturer", name: "Lecturer Agent", description: "Access to AI lecturer features", category: "Agents" },
  
  // Content & Data
  { id: "content.knowledge", name: "Knowledge Base", description: "Manage knowledge base content", category: "Content" },
  { id: "content.quizzes", name: "Quiz Management", description: "Create and manage quizzes", category: "Content" },
  { id: "content.documents", name: "Document Management", description: "Upload and manage documents", category: "Content" },
  
  // Analytics & Reports
  { id: "analytics.view", name: "View Analytics", description: "Access analytics dashboards", category: "Analytics" },
  { id: "analytics.export", name: "Export Reports", description: "Export analytics and reports", category: "Analytics" },
  
  // Security & Audit
  { id: "security.audit", name: "Audit Logs", description: "View system audit logs", category: "Security" },
  { id: "security.settings", name: "Security Settings", description: "Configure security policies", category: "Security" },
  { id: "security.backup", name: "Backup Management", description: "Create and restore backups", category: "Security" },
];

// Default permissions per role
const defaultRolePermissions: Record<AppRole, string[]> = {
  super_admin: systemPermissions.map(p => p.id), // All permissions
  org_admin: [
    "org.settings", "org.billing", "org.members",
    "users.view", "users.create", "users.edit", "users.roles",
    "agents.secretary", "agents.support", "agents.social", "agents.lecturer",
    "content.knowledge", "content.quizzes", "content.documents",
    "analytics.view", "analytics.export",
    "security.audit", "security.backup"
  ],
  staff: [
    "agents.secretary",
    "content.documents",
    "analytics.view"
  ],
  lecturer: [
    "agents.lecturer",
    "content.knowledge", "content.quizzes", "content.documents",
    "analytics.view"
  ],
  support_agent: [
    "agents.support",
    "content.knowledge",
    "analytics.view"
  ],
  end_user: []
};

export default function RolesPermissions() {
  const { isSuperAdmin, isLoading: roleLoading, refetch: refetchRoles } = useRole();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "all">("all");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at");

      if (rolesError) throw rolesError;

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p.full_name])
      );

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const usersMap = new Map<string, UserWithRole>();
      
      for (const roleData of rolesData || []) {
        const userId = roleData.user_id;
        usersMap.set(userId, {
          id: userId,
          email: userId === currentUser?.id ? currentUser.email || "Unknown" : `User ${userId.slice(0, 8)}...`,
          role: roleData.role as AppRole,
          profile_name: profilesMap.get(userId) || null,
          created_at: roleData.created_at,
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

  // Set up realtime subscription for user_roles changes
  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('Role change detected:', payload);
          fetchUsers();
          refetchRoles(); // Refresh the current user's role context
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.profile_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: AppRole) => {
    return roleColors[role];
  };

  const getPermissionCategories = () => {
    const categories = new Set(systemPermissions.map(p => p.category));
    return Array.from(categories);
  };

  const getPermissionsByCategory = (category: string) => {
    return systemPermissions.filter(p => p.category === category);
  };

  const hasPermission = (role: AppRole, permissionId: string) => {
    return defaultRolePermissions[role].includes(permissionId);
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Roles & Permissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and system-wide permissions
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Role Management
                </CardTitle>
                <CardDescription>
                  Assign and modify roles for all users. Changes take effect immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole | "all")}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <SelectItem key={role} value={role}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <div key={role} className="p-3 rounded-lg bg-accent/30 text-center">
                      <div className="flex justify-center mb-1">
                        {roleIcons[role as AppRole]}
                      </div>
                      <p className="text-xl font-bold">{users.filter(u => u.role === role).length}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Users Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Current Role</TableHead>
                          <TableHead>Change Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
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
                              <Badge className={getRoleBadgeClass(user.role)}>
                                <span className="flex items-center gap-1">
                                  {roleIcons[user.role]}
                                  {roleLabels[user.role]}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                                disabled={updatingUserId === user.id}
                              >
                                <SelectTrigger className="w-44">
                                  {updatingUserId === user.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(roleLabels).map(([role, label]) => (
                                    <SelectItem key={role} value={role}>
                                      <span className="flex items-center gap-2">
                                        {roleIcons[role as AppRole]}
                                        {label}
                                      </span>
                                    </SelectItem>
                                  ))}
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
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(roleLabels).map(([role, label]) => (
                <Card key={role} className="glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={`p-2 rounded-lg ${roleColors[role as AppRole]}`}>
                        {roleIcons[role as AppRole]}
                      </div>
                      {label}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {roleDescriptions[role as AppRole]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Users with this role</span>
                        <Badge variant="secondary">
                          {users.filter(u => u.role === role).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Permissions</span>
                        <Badge variant="outline">
                          {defaultRolePermissions[role as AppRole].length} / {systemPermissions.length}
                        </Badge>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Key Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {defaultRolePermissions[role as AppRole].slice(0, 4).map(permId => {
                            const perm = systemPermissions.find(p => p.id === permId);
                            return perm ? (
                              <Badge key={permId} variant="outline" className="text-xs">
                                {perm.name}
                              </Badge>
                            ) : null;
                          })}
                          {defaultRolePermissions[role as AppRole].length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{defaultRolePermissions[role as AppRole].length - 4} more
                            </Badge>
                          )}
                          {defaultRolePermissions[role as AppRole].length === 0 && (
                            <span className="text-xs text-muted-foreground">No special permissions</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Permission Matrix
                </CardTitle>
                <CardDescription>
                  Overview of all system permissions and which roles have access to them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64">Permission</TableHead>
                        {Object.entries(roleLabels).map(([role, label]) => (
                          <TableHead key={role} className="text-center min-w-24">
                            <div className="flex flex-col items-center gap-1">
                              {roleIcons[role as AppRole]}
                              <span className="text-xs">{label}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPermissionCategories().map(category => (
                        <React.Fragment key={category}>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={7} className="font-semibold text-sm">
                              {category}
                            </TableCell>
                          </TableRow>
                          {getPermissionsByCategory(category).map(permission => (
                            <TableRow key={permission.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{permission.name}</p>
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                                </div>
                              </TableCell>
                              {Object.keys(roleLabels).map(role => (
                                <TableCell key={role} className="text-center">
                                  {hasPermission(role as AppRole, permission.id) ? (
                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Permission Legend */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Permission Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getPermissionCategories().map(category => (
                    <div key={category} className="p-4 rounded-lg bg-accent/20">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        {category === "Platform" && <Settings className="w-4 h-4" />}
                        {category === "Organization" && <Building2 className="w-4 h-4" />}
                        {category === "Users" && <Users className="w-4 h-4" />}
                        {category === "Agents" && <UserCog className="w-4 h-4" />}
                        {category === "Content" && <Edit className="w-4 h-4" />}
                        {category === "Analytics" && <Eye className="w-4 h-4" />}
                        {category === "Security" && <Lock className="w-4 h-4" />}
                        {category}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {getPermissionsByCategory(category).length} permissions
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
