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
    // In preview mode, we need to be more aggressive with session clearing
    if (window.location.hostname.includes('preview')) {
      console.log('Preview environment detected, clearing all sessions');
      await supabase.auth.signOut({
        scope: 'global'
      });
    } else {
      console.log('Production environment, normal sign out');
      await supabase.auth.signOut({
        scope: 'local'
      });
    }
    
    console.log('Sign out API call successful');
  } catch (error) {
    console.error('Exception in signOut function:', error);
    toast.error('Error signing out. Please try again.');
    throw error;
  }
};