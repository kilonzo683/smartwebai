import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Mail, 
  HeadphonesIcon, 
  Share2, 
  GraduationCap,
  BookOpen,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Building2,
  Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";

const agents = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    color: "text-primary",
  },
  {
    id: "secretary",
    name: "Smart Secretary",
    icon: Mail,
    path: "/secretary",
    color: "text-agent-secretary",
  },
  {
    id: "support",
    name: "Customer Support",
    icon: HeadphonesIcon,
    path: "/support",
    color: "text-agent-support",
  },
  {
    id: "social",
    name: "Social Media",
    icon: Share2,
    path: "/social",
    color: "text-agent-social",
  },
  {
    id: "lecturer",
    name: "Lecturer Assistant",
    icon: GraduationCap,
    path: "/lecturer",
    color: "text-agent-lecturer",
  },
  {
    id: "student-quiz",
    name: "Student Quizzes",
    icon: BookOpen,
    path: "/student-quiz",
    color: "text-agent-lecturer",
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isOrgAdmin, isSupportAgent } = useRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground">AI Work Assistant</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {agents.map((agent) => {
          const isActive = location.pathname === agent.path;
          const Icon = agent.icon;

          return (
            <NavLink
              key={agent.id}
              to={agent.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? agent.color : "group-hover:" + agent.color
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{agent.name}</span>
              )}
            </NavLink>
          );
        })}

        {/* Tickets Link - For support agents */}
        {(isSupportAgent || isOrgAdmin || isSuperAdmin) && (
          <NavLink
            to="/tickets"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/tickets"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Ticket
              className={cn(
                "w-5 h-5 transition-colors",
                location.pathname === "/tickets" ? "text-orange-500" : "group-hover:text-orange-500"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">Tickets</span>
            )}
          </NavLink>
        )}

        {/* Organizations Link - For org admins and above */}
        {(isOrgAdmin || isSuperAdmin) && (
          <NavLink
            to="/organizations"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/organizations"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Building2
              className={cn(
                "w-5 h-5 transition-colors",
                location.pathname === "/organizations" ? "text-blue-500" : "group-hover:text-blue-500"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">Organizations</span>
            )}
          </NavLink>
        )}

        {/* Admin Link - Only visible to admins */}
        {(isSuperAdmin || isOrgAdmin) && (
          <NavLink
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/admin"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Shield
              className={cn(
                "w-5 h-5 transition-colors",
                location.pathname === "/admin" ? "text-destructive" : "group-hover:text-destructive"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">Admin</span>
            )}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            location.pathname === "/settings"
              ? "bg-accent text-foreground"
              : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-accent/50 hover:text-foreground w-full"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
}