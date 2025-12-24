import { Shield, Users, FileQuestion, Activity, Lock, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { QuizManagement } from "@/components/admin/QuizManagement";
import { ActivityLogViewer } from "@/components/admin/ActivityLogViewer";
import { AgentPermissions } from "@/components/admin/AgentPermissions";
import { InvitationManager } from "@/components/admin/InvitationManager";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, roles, permissions, and system settings
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Invites</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <FileQuestion className="w-4 h-4" />
            <span className="hidden sm:inline">Quizzes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        <TabsContent value="invitations" className="mt-6">
          <InvitationManager />
        </TabsContent>
        <TabsContent value="permissions" className="mt-6">
          <AgentPermissions />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityLogViewer />
        </TabsContent>
        <TabsContent value="quizzes" className="mt-6">
          <QuizManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}