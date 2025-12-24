import { Shield, Users, FileQuestion } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { QuizManagement } from "@/components/admin/QuizManagement";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, quizzes, and system settings
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <FileQuestion className="w-4 h-4" />
            <span className="hidden sm:inline">Quizzes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <QuizManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}