import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const isPreviewMode = () => {
  return window.location.hostname.includes('preview');
};

export const getAuthSession = async () => {
  try {
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
    // Get current session state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session found, redirecting to auth page');
      window.location.href = '/auth';
      return;
    }

    // Attempt to sign out
    await supabase.auth.signOut({ scope: 'local' });
    console.log('Sign out successful');
    toast.success('Signed out successfully');
    window.location.href = '/auth';
  } catch (error: any) {
    console.error('Error during sign out:', error);
    
    // If session not found, just redirect to auth
    if (error.message?.includes('session_not_found') || error.status === 403) {
      console.log('Session expired or not found, redirecting to auth page');
      window.location.href = '/auth';
      return;
    }
    
    toast.error('Error signing out');
    // For any other errors, still redirect to auth page to ensure user can sign in again
    window.location.href = '/auth';
  }
};

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.error('Session refresh error:', error);
      window.location.href = '/auth';
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    window.location.href = '/auth';
    return null;
  }
};