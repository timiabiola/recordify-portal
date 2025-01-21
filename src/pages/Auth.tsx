import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import ErrorAlert from '@/components/auth/ErrorAlert';
import AuthForm from '@/components/auth/AuthForm';
import { isPreviewMode } from '@/lib/auth';

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isPreviewMode()) {
          console.log('Preview mode detected, clearing session');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Active session found, redirecting to home');
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, redirecting to home');
        navigate('/', { replace: true });
      }
    });

    return () => {
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

        {error && <ErrorAlert message={error} />}

        <div className="bg-card p-6 rounded-lg shadow-sm">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;