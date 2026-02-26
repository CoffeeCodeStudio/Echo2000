import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SharedLayout } from "@/components/SharedLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Room from "./pages/Room";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import News from "./pages/News";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import { RadioProvider } from "@/contexts/RadioContext";
import { LajvProvider } from "@/contexts/LajvContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RadioProvider>
        <LajvProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Shared layout wraps all main routes */}
              <Route element={<SharedLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/rum" element={<ProtectedRoute><Room /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<News />} />
              </Route>
              
              {/* Auth page without shared layout (full-page login) */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<Admin />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </LajvProvider>
      </RadioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
