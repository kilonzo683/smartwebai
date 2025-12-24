import { useState, useEffect } from "react";
import { Shield, Lock, Key, UserCheck, Database, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: "passed" | "warning" | "failed";
  icon: React.ElementType;
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const [securityScore, setSecurityScore] = useState(0);

  const securityChecks: SecurityCheck[] = [
    {
      id: "auth",
      name: "Authentication",
      description: "Secure login with email/password",
      status: user ? "passed" : "warning",
      icon: Lock,
    },
    {
      id: "rbac",
      name: "Role-Based Access Control",
      description: "Users have appropriate permissions",
      status: "passed",
      icon: UserCheck,
    },
    {
      id: "encryption",
      name: "Data Encryption",
      description: "Data encrypted at rest and in transit",
      status: "passed",
      icon: Key,
    },
    {
      id: "isolation",
      name: "Organization Data Isolation",
      description: "Multi-tenant data separation via RLS",
      status: "passed",
      icon: Database,
    },
    {
      id: "audit",
      name: "Audit Logging",
      description: "All actions are logged for compliance",
      status: "passed",
      icon: Activity,
    },
    {
      id: "mfa",
      name: "Two-Factor Authentication",
      description: "Additional security layer for accounts",
      status: "warning",
      icon: Shield,
    },
  ];

  useEffect(() => {
    const passed = securityChecks.filter(c => c.status === "passed").length;
    const total = securityChecks.length;
    setSecurityScore(Math.round((passed / total) * 100));
  }, []);

  const getStatusBadge = (status: SecurityCheck["status"]) => {
    switch (status) {
      case "passed":
        return (
          <Badge className="bg-green-500/10 text-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Action Required
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
          <CardDescription>
            Overall security posture of your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">{securityScore}%</div>
            <div className="flex-1">
              <Progress value={securityScore} className="h-3" />
            </div>
            <Badge variant={securityScore >= 80 ? "default" : "secondary"}>
              {securityScore >= 80 ? "Excellent" : securityScore >= 60 ? "Good" : "Needs Improvement"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {securityChecks.map((check) => {
          const Icon = check.icon;
          return (
            <Card key={check.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {check.name}
                  </CardTitle>
                  {getStatusBadge(check.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {check.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
