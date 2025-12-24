import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  glowClass: string;
  path: string;
  stats: {
    label: string;
    value: string;
  }[];
  delay?: number;
}

export function AgentCard({
  name,
  description,
  icon: Icon,
  gradient,
  glowClass,
  path,
  stats,
  delay = 0,
}: AgentCardProps) {
  return (
    <Link
      to={path}
      className="group block animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
          "hover:scale-[1.02] hover:-translate-y-1",
          "glass glass-hover",
          glowClass
        )}
      >
        {/* Gradient Accent */}
        <div
          className={cn(
            "absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-40",
            gradient
          )}
        />

        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            gradient
          )}
        >
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Hover Arrow */}
        <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
