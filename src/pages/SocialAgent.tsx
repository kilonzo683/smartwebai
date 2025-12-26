import { useCallback, useRef, useState, useEffect } from "react";
import { Share2, Edit3, Calendar, MessageCircle, TrendingUp, Hash, Palette, ImagePlus } from "lucide-react";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { QuickActions } from "@/components/agents/QuickActions";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ContentCalendar } from "@/components/social/ContentCalendar";
import { CampaignManager } from "@/components/social/CampaignManager";
import { BrandProfileManager } from "@/components/social/BrandProfileManager";
import { PostEditor } from "@/components/social/PostEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  { label: "Train brand tone", icon: Palette, prompt: "__BRAND_PROFILE__" },
  { label: "Generate a post", icon: Edit3, prompt: "Help me generate an engaging social media post matching my brand voice" },
  { label: "Generate flyer", icon: ImagePlus, prompt: "__GENERATE_FLYER__" },
  { label: "View content calendar", icon: Calendar, prompt: "Show me my scheduled content and suggest posts for gaps in the calendar" },
  { label: "Reply to comments", icon: MessageCircle, prompt: "Help me draft professional replies to recent comments while maintaining brand consistency" },
  { label: "Check analytics", icon: TrendingUp, prompt: "Provide a performance summary of my recent posts and campaigns" },
  { label: "Generate hashtags", icon: Hash, prompt: "Generate relevant hashtags for my latest post based on trending topics" },
];

export default function SocialAgent() {
  const quickActionHandler = useRef<((action: string) => void) | null>(null);
  const [brandProfileOpen, setBrandProfileOpen] = useState(false);
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const { user } = useAuth();
  const [stats, setStats] = useState({ posts: 0, campaigns: 0, scheduled: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const [postsRes, campaignsRes, scheduledRes] = await Promise.all([
        supabase.from("social_content_calendar").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("social_campaigns").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("social_content_calendar").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "scheduled"),
      ]);

      setStats({
        posts: postsRes.count || 0,
        campaigns: campaignsRes.count || 0,
        scheduled: scheduledRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const handleQuickAction = useCallback((prompt: string) => {
    if (prompt === "__BRAND_PROFILE__") {
      setBrandProfileOpen(true);
      return;
    }
    if (prompt === "__GENERATE_FLYER__") {
      setPostEditorOpen(true);
      return;
    }
    if (quickActionHandler.current) {
      quickActionHandler.current(prompt);
    }
  }, []);

  const handleBrandProfileSelect = useCallback((profile: { brand_name: string; brand_voice: string | null; key_topics: string[] }) => {
    if (quickActionHandler.current) {
      quickActionHandler.current(`I've selected the "${profile.brand_name}" brand profile. Voice: ${profile.brand_voice || "not set"}. Key topics: ${profile.key_topics.join(", ") || "none"}. Please use this for content generation.`);
    }
  }, []);

  return (
    <div className="space-y-6">
      <AgentHeader
        name="AI Social Media Agent"
        description="Create content, manage campaigns, and engage your audience with brand-consistent messaging"
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
        <div className="space-y-4">
          <QuickActions 
            actions={quickActions} 
            colorClass="text-agent-social"
            onActionClick={handleQuickAction}
          />
          
          <ContentCalendar />
          <CampaignManager />
          
          <BrandProfileManager 
            isOpen={brandProfileOpen} 
            onClose={() => setBrandProfileOpen(false)}
            onProfileSelect={handleBrandProfileSelect}
          />

          {/* Post Editor for Generate Flyer quick action */}
          <PostEditor
            isOpen={postEditorOpen}
            onClose={() => setPostEditorOpen(false)}
            onSaved={() => setPostEditorOpen(false)}
          />
          
          {/* Stats Card */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Total Posts</span>
                <span className="text-sm font-semibold text-agent-social">{stats.posts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Active Campaigns</span>
                <span className="text-sm font-semibold text-agent-social">{stats.campaigns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Scheduled</span>
                <span className="text-sm font-semibold text-agent-social">{stats.scheduled}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
