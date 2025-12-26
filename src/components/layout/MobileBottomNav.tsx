import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Mail, 
  HeadphonesIcon, 
  GraduationCap,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    id: "dashboard",
    name: "Home",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "secretary",
    name: "Secretary",
    icon: Mail,
    path: "/secretary",
  },
  {
    id: "support",
    name: "Support",
    icon: HeadphonesIcon,
    path: "/support",
  },
  {
    id: "lecturer",
    name: "Lecturer",
    icon: GraduationCap,
    path: "/lecturer",
  },
  {
    id: "more",
    name: "More",
    icon: MoreHorizontal,
    path: "/settings",
  },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[4rem]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary"
              )}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
