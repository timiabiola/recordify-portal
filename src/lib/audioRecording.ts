import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio...');
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await sendAudioToSupabase(audioBlob);
      } catch (error) {
        console.error('Error sending audio:', error);
        toast.error('Failed to process audio. Please try again.');
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

const sendAudioToSupabase = async (audioBlob: Blob) => {
  try {
    console.log('Converting audio to base64...');
    const base64Audio = await blobToBase64(audioBlob);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Sending audio to voice-to-text function...');
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { audio: base64Audio, userId: user.id }
    });

    if (error) {
      console.error('Error from voice-to-text function:', error);
      throw error;
    }

    if (data?.expense) {
      toast.success('Expense recorded successfully!');
    } else {
      console.error('No expense data received:', data);
      toast.error('Failed to process expense. Please try again.');
    }

  } catch (error) {
    console.error('Error sending audio to Supabase:', error);
    throw error;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};