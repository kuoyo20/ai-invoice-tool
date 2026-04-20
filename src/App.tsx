import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConfigError from "@/components/ConfigError";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const AuthGate = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, isApproved, isAdmin } = useProfile();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginPage />;
  if (profileLoading) return <LoadingScreen />;

  // Profile 還沒建立（trigger 異常）— 等使用者點重新檢查
  if (!profile) return <PendingApproval />;

  // 還沒被 admin 核准 — 顯示等待頁
  if (!isApproved) return <PendingApproval />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/admin"
        element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  if (!isSupabaseConfigured) {
    return (
      <ErrorBoundary>
        <ConfigError />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthGate />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
