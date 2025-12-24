import { useEffect, useState } from "react";
import { TrendingUp, MessageSquare, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StatItem {
  label: string;
  value: string;
  icon: typeof Zap;
}

export function QuickStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Total Conversations", value: "0", icon: MessageSquare },
    { label: "Documents Uploaded", value: "0", icon: FileText },
    { label: "Quizzes Created", value: "0", icon: Zap },
    { label: "Quiz Attempts", value: "0", icon: TrendingUp },
  ]);

  useEffect(() => {
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
  }, [user]);

  return (
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
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}