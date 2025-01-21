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
        console.log('Checking session state...');
        setIsLoading(true);

        // In preview mode, always start with a clean slate
        if (isPreviewMode()) {
          console.log('Preview mode detected, clearing all sessions');
          await supabase.auth.signOut({ scope: 'global' });
          localStorage.clear();
          if (!mounted) return;
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          if (!mounted) return;
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log('Active session found, redirecting to home');
          if (!mounted) return;
          navigate('/');
        } else {
          console.log('No active session');
          if (!mounted) return;
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        if (!mounted) return;
        setErrorMessage('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        console.log('Sign in successful');
        setErrorMessage('');
        navigate('/');
      }

      if (event === 'SIGNED_OUT') {
        console.log('Sign out detected');
        setErrorMessage('');
        
        if (isPreviewMode()) {
          console.log('Preview mode: forcing page reload');
          window.location.href = '/auth';
          return;
        }
        
        navigate('/auth');
      }

      if (event === 'USER_UPDATED') {
        console.log('User data updated');
      }
    });

    return () => {
      console.log('Cleaning up auth subscriptions');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Recordify</h1>
          <p className="text-muted-foreground">Sign in to record your expenses</p>
        </div>

        <ErrorAlert message={errorMessage} />

        <div className="bg-card p-6 rounded-lg shadow-sm">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;