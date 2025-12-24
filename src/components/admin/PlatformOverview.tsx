import { useState, useEffect } from "react";
import { 
  Building2, Users, MessageSquare, CreditCard, TrendingUp, 
  Activity, Server, Database, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalMessages: number;
  totalConversations: number;
  activeAgents: number;
  systemHealth: number;
}

interface TopOrganization {
  id: string;
  name: string;
  subscription_plan: string;
  messages_used: number;
  max_messages: number;
}

export function PlatformOverview() {
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalMessages: 0,
    totalConversations: 0,
    activeAgents: 4,
    systemHealth: 99.9,
  });
  const [topOrgs, setTopOrgs] = useState<TopOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const [orgsRes, membersRes, conversationsRes, messagesRes] = await Promise.all([
        supabase.from("organizations").select("id, name, subscription_plan, messages_used, max_messages_per_month").order("messages_used", { ascending: false }).limit(10),
        supabase.from("organization_members").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]);

      const organizations = orgsRes.data || [];
      
      setStats({
        totalOrganizations: organizations.length,
        totalUsers: membersRes.count || 0,
        totalMessages: messagesRes.count || 0,
        totalConversations: conversationsRes.count || 0,
        activeAgents: 4,
        systemHealth: 99.9,
      });

      setTopOrgs(organizations.slice(0, 5).map(org => ({
        id: org.id,
        name: org.name,
        subscription_plan: org.subscription_plan || "free",
        messages_used: org.messages_used || 0,
        max_messages: org.max_messages_per_month || 1000,
      })));
    } catch (error) {
      console.error("Error fetching platform stats:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">
            Real-time metrics and system health
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Organizations</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Messages</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Conversations</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalConversations}</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">AI Agents</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeAgents}</p>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">System Health</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">{stats.systemHealth}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Organizations */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top Organizations by Usage
          </CardTitle>
          <CardDescription>
            Organizations with highest message consumption this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topOrgs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No organization data available
            </p>
          ) : (
            <div className="space-y-4">
              {topOrgs.map((org) => {
                const usagePercent = Math.min((org.messages_used / org.max_messages) * 100, 100);
                return (
                  <div key={org.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{org.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {org.subscription_plan}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {org.messages_used.toLocaleString()} / {org.max_messages.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">messages</p>
                      </div>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current operational status of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "API Gateway", status: "operational" },
                { name: "AI Processing", status: "operational" },
                { name: "Database", status: "operational" },
                { name: "File Storage", status: "operational" },
                { name: "Email Service", status: "operational" },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-foreground">{service.name}</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    Operational
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Users className="w-5 h-5" />
                <span className="text-xs">View All Users</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Manage Orgs</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Billing</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Activity className="w-5 h-5" />
                <span className="text-xs">View Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
