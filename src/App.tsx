import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import SecretaryAgent from "./pages/SecretaryAgent";
import SupportAgent from "./pages/SupportAgent";
import SocialAgent from "./pages/SocialAgent";
import LecturerAgent from "./pages/LecturerAgent";
import StudentQuiz from "./pages/StudentQuiz";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/secretary" element={<SecretaryAgent />} />
            <Route path="/support" element={<SupportAgent />} />
            <Route path="/social" element={<SocialAgent />} />
            <Route path="/lecturer" element={<LecturerAgent />} />
            <Route path="/student-quiz" element={<StudentQuiz />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
