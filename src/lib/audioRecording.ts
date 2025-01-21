import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');
    
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log('Received audio chunk of size:', event.data.size);
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio chunks...');
      console.log('Total chunks collected:', audioChunks.length);
      
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Created audio blob of size:', audioBlob.size);
        await sendAudioToSupabase(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process audio. Please try again.');
      }
    };

    mediaRecorder.start();
    console.log('Started recording');
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

const sendAudioToSupabase = async (audioBlob: Blob) => {
  try {
    console.log('Converting audio blob to base64...');
    const base64Audio = await blobToBase64(audioBlob);
    console.log('Base64 audio length:', base64Audio.length);
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      toast.error('Please sign in to record expenses');
      throw new Error('Not authenticated');
    }

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
    console.error('Error in sendAudioToSupabase:', error);
    throw error;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        console.log('Successfully converted blob to base64');
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading blob:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};