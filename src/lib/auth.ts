import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getAuthSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('No active session found');
    toast.error('Please sign in to record expenses');
    throw new Error('Not authenticated');
  }
  return session;
};

export const signOut = async () => {
  console.log('Starting sign out process...');
  try {
    // First clear any existing session
    await supabase.auth.setSession(null);
    console.log('Session cleared');
    
    // Then sign out
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    });
    
    if (error) {
      console.error('Supabase signOut error:', error);
      toast.error('Error signing out. Please try again.');
      throw error;
    }
    
    console.log('Sign out API call successful');
  } catch (error) {
    console.error('Exception in signOut function:', error);
    toast.error('Error signing out. Please try again.');
    throw error;
  }
};