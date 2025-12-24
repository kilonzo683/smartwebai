import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import SecretaryAgent from "./pages/SecretaryAgent";
import SupportAgent from "./pages/SupportAgent";
import SocialAgent from "./pages/SocialAgent";
import LecturerAgent from "./pages/LecturerAgent";
import StudentQuiz from "./pages/StudentQuiz";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Organizations from "./pages/Organizations";
import Tickets from "./pages/Tickets";
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoleProvider>
          <OrganizationProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Index />} />
                  <Route path="/secretary" element={<SecretaryAgent />} />
                  <Route path="/support" element={<SupportAgent />} />
                  <Route path="/social" element={<SocialAgent />} />
                  <Route path="/lecturer" element={<LecturerAgent />} />
                  <Route path="/student-quiz" element={<StudentQuiz />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/organizations" element={<Organizations />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OrganizationProvider>
        </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;