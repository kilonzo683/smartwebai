import { Share2, Edit3, Calendar, MessageCircle, TrendingUp, Hash } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Generate a post", icon: Edit3 },
  { label: "View content calendar", icon: Calendar },
  { label: "Reply to comments", icon: MessageCircle },
  { label: "Check analytics", icon: TrendingUp },
  { label: "Generate hashtags", icon: Hash },
];

export default function SocialAgent() {
  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Social Media Agent"
        description="Create content, manage your social presence, and engage your audience"
        icon={Share2}
        gradient="agent-card-social"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface
            agentName="Social Media Agent"
            agentColor="agent-card-social"
            placeholder="Ask me to create posts, generate hashtags, or plan content..."
          />
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActions} colorClass="text-agent-social" />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Posts Scheduled</span>
                <span className="text-sm font-semibold text-agent-social">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Engagement Rate</span>
                <span className="text-sm font-semibold text-agent-social">4.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Comments Replied</span>
                <span className="text-sm font-semibold text-agent-social">42</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
