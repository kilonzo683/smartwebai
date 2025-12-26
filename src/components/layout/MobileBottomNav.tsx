import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Mail, 
  HeadphonesIcon, 
  GraduationCap,
  Settings
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
    id: "settings",
    name: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-sidebar-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[4rem] active:scale-95",
                isActive
                  ? "text-secondary"
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
