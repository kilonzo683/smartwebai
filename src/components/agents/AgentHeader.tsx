import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentHeaderProps {
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

export function AgentHeader({ name, description, icon: Icon, gradient }: AgentHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-6 animate-slide-up">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", gradient)}>
        <Icon className="w-7 h-7 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{name}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
