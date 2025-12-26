import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Add top padding on mobile for the fixed header, left padding on desktop for sidebar */}
      {/* Add bottom padding on mobile for the bottom navigation */}
      <main
        className={cn(
          "pt-14 pb-20 md:pt-0 md:pb-0 transition-all duration-300",
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
