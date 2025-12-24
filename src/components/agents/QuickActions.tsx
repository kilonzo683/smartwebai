import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  prompt?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  colorClass: string;
  onActionClick?: (prompt: string) => void;
}

export function QuickActions({ actions, colorClass, onActionClick }: QuickActionsProps) {
  const handleClick = (action: QuickAction) => {
    if (onActionClick) {
      onActionClick(action.prompt || action.label);
    }
  };

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleClick(action)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                "bg-accent/30 hover:bg-accent text-foreground text-left group",
                "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  "bg-primary/20 group-hover:bg-primary/30"
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
