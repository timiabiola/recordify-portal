import { supabase } from "@/integrations/supabase/client";

export const startRecording = async (setIsRecording: (value: boolean) => void) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm' // Specify the format explicitly
    });
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      try {
        await sendAudioToSupabase(audioBlob);
      } catch (error) {
        console.error('Error sending audio:', error);
      }
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    setIsRecording(true);

    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    setIsRecording(false);
    return null;
  }
};

const sendAudioToSupabase = async (audioBlob: Blob) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Convert blob to base64
    const buffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(buffer))
    );

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