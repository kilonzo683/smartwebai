import { useCallback, useRef } from "react";
import { Share2, Edit3, Calendar, MessageCircle, TrendingUp, Hash } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";

const quickActions = [
  { label: "Generate a post", icon: Edit3, prompt: "Help me generate an engaging social media post" },
  { label: "View content calendar", icon: Calendar, prompt: "Show me the content calendar for this week" },
  { label: "Reply to comments", icon: MessageCircle, prompt: "Help me draft professional replies to recent comments" },
  { label: "Check analytics", icon: TrendingUp, prompt: "Show me social media analytics and engagement metrics" },
  { label: "Generate hashtags", icon: Hash, prompt: "Generate relevant hashtags for my latest post" },
];

export default function SocialAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);

  const handleQuickAction = useCallback((prompt: string) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

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
            agentType="social"
            placeholder="Ask me to create posts, generate hashtags, or plan content..."
            onQuickAction={(handler) => { quickActionHandler.current = handler; }}
          />
        </div>
        <div className="space-y-6">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-social"
            onActionClick={handleQuickAction}
          />
          
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
