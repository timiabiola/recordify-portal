import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import ErrorAlert from '@/components/auth/ErrorAlert';
import AuthForm from '@/components/auth/AuthForm';
import AuthContainer from '@/components/auth/AuthContainer';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthCard from '@/components/auth/AuthCard';

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
    <AuthContainer>
      <AuthHeader 
        title="Welcome to Recordify"
        subtitle="Sign in to record your expenses"
      />

      {error && <ErrorAlert message={error} />}

      <AuthCard>
        <AuthForm />
      </AuthCard>
    </AuthContainer>
  );
};

export default Auth;