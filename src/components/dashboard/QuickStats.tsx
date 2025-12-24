import { TrendingUp, MessageSquare, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Tasks Automated",
    value: "2,847",
    change: "+12.5%",
    icon: Zap,
    trend: "up",
  },
  {
    label: "Messages Handled",
    value: "15.2K",
    change: "+8.2%",
    icon: MessageSquare,
    trend: "up",
  },
  {
    label: "Active Users",
    value: "342",
    change: "+5.1%",
    icon: Users,
    trend: "up",
  },
  {
    label: "Efficiency",
    value: "94%",
    change: "+3.4%",
    icon: TrendingUp,
    trend: "up",
  },
];

export function QuickStats() {
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
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.trend === "up"
                    ? "bg-agent-support/10 text-agent-support"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
