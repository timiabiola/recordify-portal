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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    console.log('Sign out successful');
    toast.success('Signed out successfully');
    // Force reload to clear any stale state
    window.location.href = '/auth';
  } catch (error) {
    console.error('Error during sign out:', error);
    toast.error('Error signing out');
    // If we get a 403/session not found, we're already signed out
    if (error.status === 403) {
      window.location.href = '/auth';
    }
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