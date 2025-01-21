import { supabase } from "@/integrations/supabase/client";

export const startRecording = async (setIsRecording: (value: boolean) => void) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await sendAudioToSupabase(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);

    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    setIsRecording(false);
    throw error;
  }
};

const sendAudioToSupabase = async (audioBlob: Blob) => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        resolve(base64Audio);
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(audioBlob);
    const base64Audio = await base64Promise;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Send to Edge Function
    const { data, error } = await supabase.functions.invoke('voice-to-text', {
      body: { 
        audio: base64Audio,
        userId: user.id
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    console.log('Processed audio data:', data);
    return data;
  } catch (error) {
    console.error('Error sending audio to Supabase:', error);
    throw error;
  }
};