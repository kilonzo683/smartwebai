import { useEffect, useState } from "react";
import { Mail, HeadphonesIcon, Share2, GraduationCap } from "lucide-react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AgentStats {
  secretary: { conversations: number; messages: number };
  support: { conversations: number; documents: number };
  social: { conversations: number; messages: number };
  lecturer: { quizzes: number; documents: number };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats>({
    secretary: { conversations: 0, messages: 0 },
    support: { conversations: 0, documents: 0 },
    social: { conversations: 0, messages: 0 },
    lecturer: { quizzes: 0, documents: 0 },
  });
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // Fetch user profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name.split(" ")[0]);
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }

      // Fetch conversation counts by agent type
      const { data: conversations } = await supabase
        .from("conversations")
        .select("agent_type")
        .eq("user_id", user.id);

      const conversationCounts = {
        secretary: conversations?.filter(c => c.agent_type === "secretary").length || 0,
        support: conversations?.filter(c => c.agent_type === "support").length || 0,
        social: conversations?.filter(c => c.agent_type === "social").length || 0,
        lecturer: conversations?.filter(c => c.agent_type === "lecturer").length || 0,
      };

      // Fetch quizzes count
      const { count: quizCount } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch lecture documents count
      const { count: lectureDocsCount } = await supabase
        .from("lecture_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch support documents count
      const { count: supportDocsCount } = await supabase
        .from("support_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        secretary: { conversations: conversationCounts.secretary, messages: conversationCounts.secretary * 5 },
        support: { conversations: conversationCounts.support, documents: supportDocsCount || 0 },
        social: { conversations: conversationCounts.social, messages: conversationCounts.social * 3 },
        lecturer: { quizzes: quizCount || 0, documents: lectureDocsCount || 0 },
      });
    };

    fetchStats();
  }, [user]);

  const agents = [
    {
      id: "secretary",
      name: "AI Smart Secretary",
      description: "Automate emails, schedule meetings, and convert voice notes to tasks. Your 24/7 personal assistant.",
      icon: Mail,
      gradient: "agent-card-secretary",
      glowClass: "hover:glow-secretary",
      path: "/secretary",
      stats: [
        { label: "Conversations", value: stats.secretary.conversations.toString() },
        { label: "Messages Sent", value: stats.secretary.messages.toString() },
      ],
    },
    {
      id: "support",
      name: "AI Customer Support",
      description: "Answer FAQs, handle tickets, and escalate complex issues. Multi-channel support made easy.",
      icon: HeadphonesIcon,
      gradient: "agent-card-support",
      glowClass: "hover:glow-support",
      path: "/support",
      stats: [
        { label: "Conversations", value: stats.support.conversations.toString() },
        { label: "KB Documents", value: stats.support.documents.toString() },
      ],
    },
    {
      id: "social",
      name: "AI Social Media Agent",
      description: "Generate posts, manage content calendars, and engage with your audience automatically.",
      icon: Share2,
      gradient: "agent-card-social",
      glowClass: "hover:glow-social",
      path: "/social",
      stats: [
        { label: "Conversations", value: stats.social.conversations.toString() },
        { label: "Posts Drafted", value: stats.social.messages.toString() },
      ],
    },
    {
      id: "lecturer",
      name: "AI Lecturer Assistant",
      description: "Generate quizzes, summarize lectures, and track student progress. Education made smarter.",
      icon: GraduationCap,
      gradient: "agent-card-lecturer",
      glowClass: "hover:glow-lecturer",
      path: "/lecturer",
      stats: [
        { label: "Quizzes Created", value: stats.lecturer.quizzes.toString() },
        { label: "Documents", value: stats.lecturer.documents.toString() },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="gradient-text">{userName}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Your AI workforce is ready. Here's what's happening today.
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Agent Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in">
          Your AI Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} {...agent} delay={index * 100} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}