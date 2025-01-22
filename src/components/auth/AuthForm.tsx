import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const AuthForm = () => {
  // Get the current origin, removing any trailing slash
  const redirectTo = window.location.origin.replace(/\/$/, '');
  
  console.log('Auth redirect URL:', redirectTo);

  return (
    <Auth 
      supabaseClient={supabase}
      appearance={{ 
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: 'rgb(var(--primary))',
              brandAccent: 'rgb(var(--primary))',
            },
          },
        },
      }}
      providers={[]}
      redirectTo={redirectTo}
    />
  );
};

export default AuthForm;