import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateRequest(authHeader: string | null) {
  if (!authHeader) {
    console.error('No authorization header found');
    throw new Error('Authentication required. Please sign in.');
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  
  if (authError || !user) {
    console.error('Authentication error:', authError);
    throw new Error('Invalid authentication. Please sign in again.');
  }

  console.log('Authenticated user:', user.id);
  return { user, supabaseAdmin };
}