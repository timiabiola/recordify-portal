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
    
    // Clear local storage
    localStorage.clear();
    
    // Clear all auth-related cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    
    try {
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Sign out error (expected if session expired):', error);
      } else {
        console.log('Supabase sign out completed');
      }
    } catch (error) {
      // If we get here with a session_not_found, that's actually okay
      console.log('Sign out error caught (expected if session expired):', error);
    }
    
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