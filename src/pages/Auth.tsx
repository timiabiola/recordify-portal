import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import ErrorAlert from '@/components/auth/ErrorAlert';
import AuthForm from '@/components/auth/AuthForm';
import { isPreviewMode } from '@/lib/auth';

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log('Auth page: Starting session check');
        
        if (!mounted) {
          console.log('Auth: Component unmounted, aborting session check');
          return;
        }

        // Handle preview mode
        if (isPreviewMode()) {
          console.log('Preview mode detected on Auth page');
          await supabase.auth.signOut();
          localStorage.clear();
          if (!mounted) return;
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('Auth: Component unmounted after session check');
          return;
        }

        if (error) {
          console.error('Session check error:', error);
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log('Active session found, redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('No active session found, showing auth form');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        if (!mounted) return;
        setErrorMessage('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    // Initial session check
    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', session ? 'exists' : 'null');
      
      if (!mounted) {
        console.log('Auth: Component unmounted, ignoring auth state change');
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        console.log('Sign in successful, redirecting to home');
        setErrorMessage('');
        navigate('/', { replace: true });
      }

      if (event === 'SIGNED_OUT') {
        console.log('Sign out detected on Auth page');
        setErrorMessage('');
        setIsLoading(false);
      }
    });

    return () => {
      console.log('Auth page: Cleaning up');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Recordify</h1>
          <p className="text-muted-foreground">Sign in to record your expenses</p>
        </div>

        <ErrorAlert message={errorMessage} />

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <AuthForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;