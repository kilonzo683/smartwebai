import { useCallback, useRef, useState, useEffect } from "react";
import { Share2, Edit3, Calendar, MessageCircle, TrendingUp, Hash } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  { label: "Generate a post", icon: Edit3, prompt: "Help me generate an engaging social media post" },
  { label: "View content calendar", icon: Calendar, prompt: "Show me the content calendar for this week" },
  { label: "Reply to comments", icon: MessageCircle, prompt: "Help me draft professional replies to recent comments" },
  { label: "Check analytics", icon: TrendingUp, prompt: "Show me social media analytics and engagement metrics" },
  { label: "Generate hashtags", icon: Hash, prompt: "Generate relevant hashtags for my latest post" },
];

export default function SocialAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const { user } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, messages: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("agent_type", "social");

      const conversationIds = conversations?.map(c => c.id) || [];
      
      let messageCount = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds);
        messageCount = count || 0;
      }

      setStats({
        conversations: conversations?.length || 0,
        messages: messageCount,
      });
    };
    fetchStats();
  }, [user]);

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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Conversations</span>
                <span className="text-sm font-semibold text-agent-social">{stats.conversations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Messages</span>
                <span className="text-sm font-semibold text-agent-social">{stats.messages}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
