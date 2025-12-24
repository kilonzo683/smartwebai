import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  colorClass: string;
}

export function QuickActions({ actions, colorClass }: QuickActionsProps) {
  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                "bg-accent/30 hover:bg-accent text-foreground text-left group"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  colorClass.replace("text-", "bg-") + "/20",
                  "group-hover:" + colorClass.replace("text-", "bg-") + "/30"
                )}
              >
                <Icon className={cn("w-4 h-4", colorClass)} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
