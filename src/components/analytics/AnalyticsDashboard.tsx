import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, 
  AlertTriangle, ThumbsUp, Download, Loader2, Calendar, TestTube
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useDemoData } from "@/hooks/useDemoData";

interface PerformanceMetric {
  agent_type: string;
  date: string;
  total_conversations: number;
  resolved_conversations: number;
  escalated_conversations: number;
  avg_confidence_score: number;
  avg_satisfaction_score: number;
  total_messages: number;
}

interface ConversationStats {
  total: number;
  resolved: number;
  escalated: number;
  avgConfidence: number;
  avgSatisfaction: number;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const agentLabels: Record<string, string> = {
  secretary: "Secretary",
  support: "Support",
  social: "Social",
  lecturer: "Lecturer",
};

export function AnalyticsDashboard() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { isDemoMode, analytics: demoAnalytics } = useDemoData();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [selectedAgent, setSelectedAgent] = useState("all");
  
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    total: 0,
    resolved: 0,
    escalated: 0,
    avgConfidence: 0,
    avgSatisfaction: 0,
  });
  const [agentDistribution, setAgentDistribution] = useState<{ name: string; value: number }[]>([]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const days = parseInt(dateRange);
    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    try {
      // Fetch agent performance
      let perfQuery = supabase
        .from("agent_performance")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (currentOrg) {
        perfQuery = perfQuery.eq("organization_id", currentOrg.id);
      }

      if (selectedAgent !== "all") {
        perfQuery = perfQuery.eq("agent_type", selectedAgent);
      }

      const { data: perfData } = await perfQuery;
      setPerformanceData((perfData as PerformanceMetric[]) || []);

      // Fetch conversation stats
      let convQuery = supabase
        .from("conversations")
        .select("id, is_escalated, resolved_at, confidence_score, customer_satisfaction, agent_type")
        .gte("created_at", startOfDay(subDays(new Date(), days)).toISOString());

      if (selectedAgent !== "all") {
        convQuery = convQuery.eq("agent_type", selectedAgent);
      }

      const { data: convData } = await convQuery;

      if (convData) {
        const total = convData.length;
        const resolved = convData.filter((c) => c.resolved_at).length;
        const escalated = convData.filter((c) => c.is_escalated).length;
        const confidenceScores = convData
          .filter((c) => c.confidence_score)
          .map((c) => Number(c.confidence_score));
        const satisfactionScores = convData
          .filter((c) => c.customer_satisfaction)
          .map((c) => c.customer_satisfaction!);

        setConversationStats({
          total,
          resolved,
          escalated,
          avgConfidence:
            confidenceScores.length > 0
              ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
              : 0,
          avgSatisfaction:
            satisfactionScores.length > 0
              ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
              : 0,
        });

        // Agent distribution
        const distribution = convData.reduce((acc, conv) => {
          acc[conv.agent_type] = (acc[conv.agent_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setAgentDistribution(
          Object.entries(distribution).map(([name, value]) => ({
            name: agentLabels[name] || name,
            value,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If demo mode, use demo data
    if (isDemoMode && demoAnalytics) {
      setConversationStats({
        total: 1085,
        resolved: 892,
        escalated: 67,
        avgConfidence: 0.89,
        avgSatisfaction: 4.2,
      });
      setAgentDistribution(
        demoAnalytics.messagesByAgent.map((a) => ({
          name: a.agent,
          value: a.messages,
        }))
      );
      setIsLoading(false);
      return;
    }
    
    fetchAnalytics();
  }, [currentOrg, dateRange, selectedAgent, isDemoMode, demoAnalytics]);

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      stats: conversationStats,
      performance: performanceData,
      agentDistribution,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
  };

  const resolutionRate = conversationStats.total > 0
    ? ((conversationStats.resolved / conversationStats.total) * 100).toFixed(1)
    : "0";

  const escalationRate = conversationStats.total > 0
    ? ((conversationStats.escalated / conversationStats.total) * 100).toFixed(1)
    : "0";

  // Prepare chart data - use demo data if in demo mode
  const trendData = isDemoMode && demoAnalytics
    ? demoAnalytics.conversationsByDay.map((d) => ({
        date: d.date,
        conversations: d.count,
        resolved: Math.floor(d.count * 0.82),
        escalated: Math.floor(d.count * 0.06),
      }))
    : performanceData.reduce((acc, item) => {
        const existing = acc.find((d) => d.date === item.date);
        if (existing) {
          existing.conversations += item.total_conversations;
          existing.resolved += item.resolved_conversations;
          existing.escalated += item.escalated_conversations;
        } else {
          acc.push({
            date: format(new Date(item.date), "MMM d"),
            conversations: item.total_conversations,
            resolved: item.resolved_conversations,
            escalated: item.escalated_conversations,
          });
        }
        return acc;
      }, [] as { date: string; conversations: number; resolved: number; escalated: number }[]);

  // Demo satisfaction trend data
  const satisfactionTrendData = isDemoMode && demoAnalytics
    ? demoAnalytics.satisfactionTrend
    : [];

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <TestTube className="w-5 h-5 text-purple-500" />
          <div>
            <p className="font-medium text-purple-500">Demo Mode Active</p>
            <p className="text-sm text-muted-foreground">Showing sample analytics data for demonstration purposes</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
            <p className="text-muted-foreground">Track performance and engagement metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange} disabled={isDemoMode}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isDemoMode}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="secretary">Secretary</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="lecturer">Lecturer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <Badge variant="secondary">{dateRange}d</Badge>
                </div>
                <p className="text-3xl font-bold mt-4">{conversationStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-500">{resolutionRate}%</Badge>
                </div>
                <p className="text-3xl font-bold mt-4">{conversationStats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <Badge className="bg-red-500/10 text-red-500">{escalationRate}%</Badge>
                </div>
                <p className="text-3xl font-bold mt-4">{conversationStats.escalated}</p>
                <p className="text-sm text-muted-foreground">Escalated</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-3xl font-bold mt-4">
                  {(conversationStats.avgConfidence * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <ThumbsUp className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold mt-4">
                  {conversationStats.avgSatisfaction.toFixed(1)}/5
                </p>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
                <CardDescription>Daily conversation volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="conversations"
                        name="Total"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Agent Distribution</CardTitle>
                <CardDescription>Conversations by AI agent type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {agentDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={agentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {agentDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Summary</CardTitle>
              <CardDescription>Plain-language performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-accent/30 space-y-3">
                <p className="text-sm">
                  📊 Over the last <strong>{dateRange} days</strong>, your AI agents handled{" "}
                  <strong>{conversationStats.total} conversations</strong>.
                </p>
                <p className="text-sm">
                  ✅ <strong>{resolutionRate}%</strong> of conversations were resolved
                  successfully without human intervention.
                </p>
                {parseFloat(escalationRate) > 10 && (
                  <p className="text-sm text-yellow-500">
                    ⚠️ Escalation rate is at <strong>{escalationRate}%</strong>. Consider
                    reviewing escalated tickets for training opportunities.
                  </p>
                )}
                {conversationStats.avgSatisfaction >= 4 && (
                  <p className="text-sm text-green-500">
                    🎉 Customer satisfaction is excellent at{" "}
                    <strong>{conversationStats.avgSatisfaction.toFixed(1)}/5</strong>!
                  </p>
                )}
                {agentDistribution.length > 0 && (
                  <p className="text-sm">
                    🤖 Most active agent:{" "}
                    <strong>
                      {agentDistribution.reduce((prev, current) =>
                        prev.value > current.value ? prev : current
                      ).name}
                    </strong>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
