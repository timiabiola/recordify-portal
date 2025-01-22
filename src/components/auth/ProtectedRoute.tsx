import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { refreshSession } from "@/lib/auth";
import { toast } from "sonner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session ? 'authenticated' : 'not authenticated');
        
        if (error) {
          console.error('Session check error:', error);
          setIsAuthenticated(false);
          toast.error("Session error. Please sign in again.");
          return;
        }

        if (!session) {
          console.log('No active session found');
          setIsAuthenticated(false);
          return;
        }

        // If session exists but might be expired, try to refresh it
        const refreshedSession = await refreshSession();
        console.log('Session refresh result:', refreshedSession ? 'success' : 'failed');
        setIsAuthenticated(!!refreshedSession);
      } catch (error) {
        console.error('Session check error:', error);
        setIsAuthenticated(false);
        toast.error("Authentication error. Please sign in again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', session ? 'exists' : 'null');
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setIsAuthenticated(false);
        window.location.href = '/auth';
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed');
        setIsAuthenticated(true);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to auth page');
    return <Navigate to="/auth" replace />;
  }

  return children;
};