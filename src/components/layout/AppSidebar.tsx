import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Mail, 
  HeadphonesIcon, 
  Share2, 
  GraduationCap,
  FileText,
  BookOpen,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Building2,
  Ticket,
  MessageSquare,
  BarChart3,
  CreditCard,
  Lock,
  Crown,
  Menu,
  Wrench,
  TestTube
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useBranding } from "@/contexts/BrandingContext";
import { usePlatformStatus } from "@/contexts/PlatformStatusContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  {
    id: "channels",
    name: "Channels",
    icon: MessageSquare,
    path: "/channels",
    color: "text-cyan-500",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    color: "text-purple-500",
  },
  {
    id: "billing",
    name: "Billing",
    icon: CreditCard,
    path: "/billing",
    color: "text-green-500",
  },
  {
    id: "security",
    name: "Security",
    icon: Lock,
    path: "/security",
    color: "text-red-500",
  },
  {
    id: "resumes",
    name: "Resume Builder",
    icon: FileText,
    path: "/resumes",
    color: "text-indigo-500",
  },
];

function SidebarContent({ 
  collapsed = false, 
  onNavigate 
}: { 
  collapsed?: boolean; 
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isOrgAdmin, isSupportAgent } = useRole();
  const { branding } = useBranding();
  const { maintenanceMode, demoMode } = usePlatformStatus();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
    onNavigate?.();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {/* Use mobile logo when collapsed, desktop logo when expanded */}
          {collapsed ? (
            (branding.mobileLogoUrl || branding.logoUrl) ? (
              <img 
                src={branding.mobileLogoUrl || branding.logoUrl || ""} 
                alt={branding.platformName} 
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )
          ) : (
            branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.platformName} 
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            )
          )}
          {!collapsed && (
            <span className="font-semibold text-foreground">{branding.platformName}</span>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      {(maintenanceMode || demoMode) && (
        <div className="px-2 py-2 space-y-1">
          {maintenanceMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 w-full text-left",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Wrench className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-xs font-medium text-orange-500">Maintenance Mode</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Platform is in maintenance mode</p>
              </TooltipContent>
            </Tooltip>
          )}
          {demoMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 w-full text-left",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <TestTube className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-xs font-medium text-purple-500">Demo Mode</span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Demo features are enabled</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {agents.map((agent) => {
          const isActive = location.pathname === agent.path;
          const Icon = agent.icon;

          return (
            <NavLink
              key={agent.id}
              to={agent.path}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors flex-shrink-0",
                  isActive ? agent.color : "group-hover:" + agent.color
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm truncate">{agent.name}</span>
              )}
            </NavLink>
          );
        })}

        {/* Tickets Link - For support agents */}
        {(isSupportAgent || isOrgAdmin || isSuperAdmin) && (
          <NavLink
            to="/tickets"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/tickets"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Ticket
              className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
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
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/organizations"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Building2
              className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
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
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/admin"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Shield
              className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
                location.pathname === "/admin" ? "text-destructive" : "group-hover:text-destructive"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">Admin</span>
            )}
          </NavLink>
        )}

        {/* Roles & Permissions - Super Admin only */}
        {isSuperAdmin && (
          <NavLink
            to="/roles-permissions"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/roles-permissions"
                ? "bg-accent text-foreground"
                : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Crown
              className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
                location.pathname === "/roles-permissions" ? "text-yellow-500" : "group-hover:text-yellow-500"
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">Roles & Permissions</span>
            )}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            location.pathname === "/settings"
              ? "bg-accent text-foreground"
              : "text-sidebar-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-accent/50 hover:text-foreground w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </>
  );
}

export function AppSidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { branding } = useBranding();
  const { maintenanceMode, demoMode } = usePlatformStatus();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
              <div className="flex flex-col h-full">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          {/* Mobile Status Indicators */}
          {maintenanceMode && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20">
              <Wrench className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] font-medium text-orange-500">Maintenance</span>
            </div>
          )}
          {demoMode && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
              <TestTube className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-medium text-purple-500">Demo</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Use mobile logo for mobile header, fallback to desktop logo */}
          {(branding.mobileLogoUrl || branding.logoUrl) ? (
            <img 
              src={branding.mobileLogoUrl || branding.logoUrl || ""} 
              alt={branding.platformName} 
              className="w-7 h-7 rounded-lg object-contain"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="font-semibold text-foreground text-sm">{branding.platformName}</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col hidden md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border hover:bg-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </aside>
    </>
  );
}
