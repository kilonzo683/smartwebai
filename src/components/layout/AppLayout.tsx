import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      {/* Add top padding on mobile for the fixed header, left padding on desktop for sidebar */}
      {/* Add bottom padding on mobile for the bottom navigation */}
      <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:pl-16 lg:pl-64 transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
