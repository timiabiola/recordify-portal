import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPreviewMode } from "@/lib/auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log('ProtectedRoute: Checking session');
        
        if (!mounted) {
          console.log('ProtectedRoute: Component unmounted, aborting check');
          return;
        }

        // Handle preview mode
        if (isPreviewMode()) {
          console.log('Preview mode detected in ProtectedRoute');
          await supabase.auth.signOut();
          localStorage.clear();
          if (!mounted) return;
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          if (!mounted) return;
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        console.log('Session check result:', session ? 'authenticated' : 'not authenticated');
        if (!mounted) return;
        setIsAuthenticated(!!session);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        if (!mounted) return;
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
      }
    };

    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (!mounted) {
        console.log('ProtectedRoute: Component unmounted, ignoring auth state change');
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setIsAuthenticated(false);
      } else if (session) {
        console.log('User authenticated');
        setIsAuthenticated(true);
      }
    });

    return () => {
      console.log('ProtectedRoute: Cleaning up');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;