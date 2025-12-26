import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Onboarding from "./pages/Onboarding";
import SecretaryAgent from "./pages/SecretaryAgent";
import SupportAgent from "./pages/SupportAgent";
import SocialAgent from "./pages/SocialAgent";
import LecturerAgent from "./pages/LecturerAgent";
import StudentQuiz from "./pages/StudentQuiz";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Organizations from "./pages/Organizations";
import Tickets from "./pages/Tickets";
import Channels from "./pages/Channels";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import Security from "./pages/Security";
import RolesPermissions from "./pages/RolesPermissions";
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrandingProvider>
        <AuthProvider>
          <RoleProvider>
            <OrganizationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />
                  <Route
                    element={
                      <ProtectedRoute>
                        <SidebarProvider>
                          <AppLayout />
                        </SidebarProvider>
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
                    <Route path="/channels" element={<Channels />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/roles-permissions" element={<RolesPermissions />} />
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
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;