import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import ErrorAlert from '@/components/auth/ErrorAlert';
import AuthForm from '@/components/auth/AuthForm';

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setErrorMessage(error.message);
          return;
        }

        if (session) {
          console.log('Valid session found, redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in successfully');
        navigate('/');
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setErrorMessage("");
        
        // Sign out using the correct method
        await supabase.auth.signOut();
        
        // In preview mode, force a full page reload
        if (window.location.hostname.includes('preview')) {
          console.log('Preview environment detected, forcing full reload');
          window.location.replace('/auth');
          return;
        }
        
        toast.success('Signed out successfully');
        navigate('/auth');
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
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