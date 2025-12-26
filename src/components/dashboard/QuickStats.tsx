import { useEffect, useState } from "react";
import { TrendingUp, MessageSquare, FileText, Zap, Users, Clock, CheckCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoData } from "@/hooks/useDemoData";
import { Badge } from "@/components/ui/badge";

interface StatItem {
  label: string;
  value: string;
  icon: typeof Zap;
  trend?: string;
}

export function QuickStats() {
  const { user } = useAuth();
  const { isDemoMode, quickStats: demoStats } = useDemoData();
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Total Conversations", value: "0", icon: MessageSquare },
    { label: "Documents Uploaded", value: "0", icon: FileText },
    { label: "Quizzes Created", value: "0", icon: Zap },
    { label: "Quiz Attempts", value: "0", icon: TrendingUp },
  ]);

  useEffect(() => {
    // If demo mode is enabled, use demo data
    if (isDemoMode && demoStats) {
      setStats([
        { label: "Total Conversations", value: demoStats.totalConversations.toLocaleString(), icon: MessageSquare, trend: "+12%" },
        { label: "Active Users", value: demoStats.activeUsers.toString(), icon: Users, trend: "+5%" },
        { label: "Avg Response Time", value: demoStats.avgResponseTime, icon: Clock, trend: "-8%" },
        { label: "Satisfaction Score", value: `${demoStats.satisfactionScore}%`, icon: TrendingUp, trend: "+3%" },
      ]);
      return;
    }

    if (!user) return;

    const fetchStats = async () => {
      // Fetch total conversations
      const { count: conversationCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch total documents (lecture + support)
      const { count: lectureDocsCount } = await supabase
        .from("lecture_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: supportDocsCount } = await supabase
        .from("support_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch quizzes created
      const { count: quizCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch quiz attempts
      const { count: attemptCount } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const totalDocs = (lectureDocsCount || 0) + (supportDocsCount || 0);

      setStats([
        { label: "Total Conversations", value: (conversationCount || 0).toString(), icon: MessageSquare },
        { label: "Documents Uploaded", value: totalDocs.toString(), icon: FileText },
        { label: "Quizzes Created", value: (quizCount || 0).toString(), icon: Zap },
        { label: "Quiz Attempts", value: (attemptCount || 0).toString(), icon: TrendingUp },
      ]);
    };

    fetchStats();
  }, [user, isDemoMode, demoStats]);

  return (
    <div className="space-y-2">
      {isDemoMode && (
        <div className="flex items-center gap-2 text-purple-500 text-sm">
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-500">
            Demo Data
          </Badge>
          <span className="text-muted-foreground">Showing sample statistics</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass rounded-xl p-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {stat.trend && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
