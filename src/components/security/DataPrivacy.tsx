import { Shield, Lock, Eye, Trash2, Download, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function DataPrivacy() {
  const handleExportData = () => {
    toast.info("Data export will be sent to your email within 24 hours");
  };

  const handleDeleteData = () => {
    toast.error("Please contact support to delete all organization data");
  };

  const privacyFeatures = [
    {
      icon: Lock,
      title: "Encryption at Rest",
      description: "All data is encrypted using AES-256 encryption",
      status: "Active",
    },
    {
      icon: Server,
      title: "Encryption in Transit",
      description: "TLS 1.3 for all data transmission",
      status: "Active",
    },
    {
      icon: Eye,
      title: "Data Access Logging",
      description: "All data access is logged and auditable",
      status: "Active",
    },
    {
      icon: Shield,
      title: "Row Level Security",
      description: "Database-level isolation between organizations",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Protection
          </CardTitle>
          <CardDescription>
            How we protect your organization's data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {privacyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{feature.title}</h4>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your organization's data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Export All Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a complete copy of your organization's data
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
            <div>
              <h4 className="font-medium text-destructive">Delete All Data</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all organization data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteData}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>
            Our platform is designed with compliance in mind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-base py-1.5 px-3">
              GDPR Ready
            </Badge>
            <Badge variant="outline" className="text-base py-1.5 px-3">
              SOC 2 Type II
            </Badge>
            <Badge variant="outline" className="text-base py-1.5 px-3">
              ISO 27001
            </Badge>
            <Badge variant="outline" className="text-base py-1.5 px-3">
              HIPAA Eligible
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
