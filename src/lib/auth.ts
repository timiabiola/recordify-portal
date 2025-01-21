import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const isPreviewMode = () => {
  return window.location.hostname.includes('preview');
};

export const getAuthSession = async () => {
  try {
    // Don't check session in preview mode
    if (isPreviewMode()) {
      console.log('Preview mode: skipping session check');
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getAuthSession:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    console.log('Sign out successful');
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Error during sign out:', error);
    toast.error('Error signing out');
    throw error;
  }
};