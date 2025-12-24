import { Mail, HeadphonesIcon, Share2, GraduationCap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    agent: "secretary",
    icon: Mail,
    action: "Drafted email response",
    target: "to client inquiry about pricing",
    time: "2 min ago",
    color: "text-agent-secretary",
    bgColor: "bg-agent-secretary/10",
  },
  {
    id: 2,
    agent: "support",
    icon: HeadphonesIcon,
    action: "Resolved ticket #4521",
    target: "Password reset request",
    time: "5 min ago",
    color: "text-agent-support",
    bgColor: "bg-agent-support/10",
  },
  {
    id: 3,
    agent: "social",
    icon: Share2,
    action: "Scheduled 3 posts",
    target: "for Twitter and LinkedIn",
    time: "12 min ago",
    color: "text-agent-social",
    bgColor: "bg-agent-social/10",
  },
  {
    id: 4,
    agent: "lecturer",
    icon: GraduationCap,
    action: "Generated quiz",
    target: "Chapter 5 - Machine Learning Basics",
    time: "28 min ago",
    color: "text-agent-lecturer",
    bgColor: "bg-agent-lecturer/10",
  },
  {
    id: 5,
    agent: "secretary",
    icon: Mail,
    action: "Scheduled meeting",
    target: "with John Doe for tomorrow 3PM",
    time: "45 min ago",
    color: "text-agent-secretary",
    bgColor: "bg-agent-secretary/10",
  },
];

export function RecentActivity() {
  return (
    <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>

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
    </div>
  );
}
