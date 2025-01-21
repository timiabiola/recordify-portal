import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const isPreviewMode = () => {
  return window.location.hostname.includes('preview');
};

export const getAuthSession = async () => {
  console.log('Getting auth session...');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  if (!session) {
    console.error('No active session found');
    throw new Error('Not authenticated');
  }
  
  console.log('Valid session found for user:', session.user.id);
  return session;
};

export const signOut = async () => {
  console.log('Starting sign out process...');
  try {
    if (isPreviewMode()) {
      console.log('Preview mode detected, performing global sign out');
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.clear(); // Clear all local storage in preview mode
    } else {
      console.log('Production mode, performing local sign out');
      await supabase.auth.signOut();
    }
    
    console.log('Sign out successful');
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Error during sign out:', error);
    toast.error('Error signing out. Please try again.');
    throw error;
  }
};