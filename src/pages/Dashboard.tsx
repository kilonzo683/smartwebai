import { Mail, HeadphonesIcon, Share2, GraduationCap } from "lucide-react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

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
      { label: "Emails Handled", value: "847" },
      { label: "Meetings Scheduled", value: "52" },
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
      { label: "Tickets Resolved", value: "2.3K" },
      { label: "Avg Response", value: "< 30s" },
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
      { label: "Posts Created", value: "186" },
      { label: "Engagement Rate", value: "4.8%" },
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
      { label: "Quizzes Generated", value: "124" },
      { label: "Students Helped", value: "1.2K" },
    ],
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, <span className="gradient-text">Alex</span>
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
