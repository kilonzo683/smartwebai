import { Shield, History, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityDashboard } from "@/components/security/SecurityDashboard";
import { AuditLogViewer } from "@/components/security/AuditLogViewer";
import { DataPrivacy } from "@/components/security/DataPrivacy";

export default function Security() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security & Compliance</h1>
          <p className="text-muted-foreground">
            Monitor security, view audit trails, and manage data privacy
          </p>
        </div>
      </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Overview
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Data Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="privacy">
            <DataPrivacy />
          </TabsContent>
      </Tabs>
    </div>
  );
}
