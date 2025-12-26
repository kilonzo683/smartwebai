import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { usePlatformStatus } from "@/contexts/PlatformStatusContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { isSuperAdmin, isOrgAdmin, isLoading: roleLoading } = useRole();
  const { maintenanceMode, isLoading: statusLoading } = usePlatformStatus();
  const location = useLocation();

  if (isLoading || roleLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page, saving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If maintenance mode is on and user is not an admin, redirect to maintenance page
  if (maintenanceMode && !isSuperAdmin && !isOrgAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  return <>{children}</>;
}