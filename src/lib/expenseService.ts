import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAuthSession } from './auth';
import { blobToBase64 } from './audioUtils';

export const submitExpenseAudio = async (audioBlob: Blob) => {
  try {
    console.log('Converting audio blob to base64...');
    const base64Audio = await blobToBase64(audioBlob);
    console.log('Base64 audio length:', base64Audio.length);
    
    const session = await getAuthSession();

    console.log('Invoking voice-to-text function with auth token...');
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { audio: base64Audio },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Error from voice-to-text function:', error);
      throw error;
    }

    console.log('Received response from voice-to-text:', data);
    if (data?.expense) {
      console.log('Expense data received:', data.expense);
      toast.success('Expense recorded successfully!');
    } else {
      console.error('No expense data in response:', data);
      toast.error('Failed to process expense. Please try again.');
    }

  } catch (error) {
    console.error('Error in submitExpenseAudio:', error);
    throw error;
  }
};