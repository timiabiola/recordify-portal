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
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out. Please try again.');
      throw error;
    }
    toast.success('Signed out successfully');
  } catch (error) {
    console.error('Error in signOut function:', error);
    toast.error('Error signing out. Please try again.');
    throw error;
  }
};