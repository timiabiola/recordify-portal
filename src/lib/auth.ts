import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getAuthSession = async () => {
  console.log('Getting auth session...');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  if (!session) {
    console.error('No active session found');
    toast.error('Please sign in to record expenses');
    throw new Error('Not authenticated');
  }
  
  console.log('Valid session found for user:', session.user.id);
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
    
    // Clear any stored session data
    localStorage.removeItem('supabase.auth.token');
    
    console.log('Sign out successful');
  } catch (error) {
    console.error('Exception in signOut function:', error);
    toast.error('Error signing out. Please try again.');
    throw error;
  }
};