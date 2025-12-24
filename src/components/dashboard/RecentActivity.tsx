import { useEffect, useState } from "react";
import { Mail, HeadphonesIcon, Share2, GraduationCap, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  agent: string;
  icon: typeof Mail;
  action: string;
  target: string;
  time: string;
  color: string;
  bgColor: string;
}

const agentConfig: Record<string, { icon: typeof Mail; color: string; bgColor: string; action: string }> = {
  secretary: {
    icon: Mail,
    color: "text-agent-secretary",
    bgColor: "bg-agent-secretary/10",
    action: "Chat with Secretary",
  },
  support: {
    icon: HeadphonesIcon,
    color: "text-agent-support",
    bgColor: "bg-agent-support/10",
    action: "Support conversation",
  },
  social: {
    icon: Share2,
    color: "text-agent-social",
    bgColor: "bg-agent-social/10",
    action: "Social media chat",
  },
  lecturer: {
    icon: GraduationCap,
    color: "text-agent-lecturer",
    bgColor: "bg-agent-lecturer/10",
    action: "Lecturer session",
  },
};

export function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      setIsLoading(true);
      
      // Fetch recent conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, agent_type, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (conversations) {
        const activityList: Activity[] = conversations.map((conv) => {
          const config = agentConfig[conv.agent_type] || agentConfig.secretary;
          return {
            id: conv.id,
            agent: conv.agent_type,
            icon: config.icon,
            action: config.action,
            target: conv.title || "New conversation",
            time: formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true }),
            color: config.color,
            bgColor: config.bgColor,
          };
        });
        setActivities(activityList);
      }
      
      setIsLoading(false);
    };

    fetchActivities();
  }, [user]);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-3">
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">Start a conversation with an AI agent to see activity here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer group"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    activity.bgColor
                  )}
                >
                  <Icon className={cn("w-5 h-5", activity.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.target}
                  </p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {activity.time}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}