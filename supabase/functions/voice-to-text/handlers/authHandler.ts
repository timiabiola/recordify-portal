import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function validateUser(headers: Headers) {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    console.log('No authorization header found');
    return null;
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Extract user ID from token
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    return null;
  }

  return user;
}