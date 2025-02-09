
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const AuthForm = () => {
  // Get the current origin for the preview URL
  const currentOrigin = window.location.origin;
  console.log('Auth redirect URL:', currentOrigin);

  // Use the production URL for the deployed version, otherwise use the current origin
  const redirectUrl = process.env.NODE_ENV === 'production' 
    ? 'https://app.echoledger.io/auth/callback'
    : `${currentOrigin}/auth/callback`;

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
      redirectTo={redirectUrl}
    />
  );
};

export default AuthForm;
