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
    console.log('Starting sign out process...');
    
    // Clear local storage and cookies related to auth
    localStorage.removeItem('supabase.auth.token');
    document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    try {
      // Attempt to sign out from Supabase
      await supabase.auth.signOut();
      console.log('Supabase sign out completed');
    } catch (error: any) {
      // If we get here with a session_not_found, that's actually okay
      // It means we're already signed out
      console.log('Sign out error (expected if session expired):', error);
    }

    // Clear any remaining session state
    await supabase.auth.clearSession();
    
    console.log('Sign out process completed');
    toast.success('Signed out successfully');
    
    // Always redirect to auth page after clearing everything
    window.location.href = '/auth';
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    // Even if something went wrong, redirect to auth
    window.location.href = '/auth';
  }
};

export const refreshSession = async () => {
  try {
    console.log('Attempting to refresh session...');
    
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session refresh error:', sessionError);
      return null;
    }

    if (!session) {
      console.log('No active session found');
      return null;
    }

    // If we have a session but it's expired, try to refresh it
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      console.log('Session expired, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        return null;
      }
      
      return refreshedSession;
    }

    return session;
  } catch (error) {
    console.error('Error in refreshSession:', error);
    return null;
  }
};