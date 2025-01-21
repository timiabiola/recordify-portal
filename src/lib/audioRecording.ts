import { supabase } from "@/integrations/supabase/client";

export async function startRecording({ isRecording, setIsRecording }: { 
  isRecording: boolean; 
  setIsRecording: (isRecording: boolean) => void 
}) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio...');
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64WithoutPrefix = base64Audio.split(',')[1];
        
        try {
          console.log('Sending audio to voice-to-text function...');
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64WithoutPrefix }
          });

          if (error) {
            console.error('Error processing audio:', error);
            throw error;
          }

          console.log('Voice-to-text response:', data);
          
          // Refresh the page to show new expenses
          window.location.reload();
        } catch (error) {
          console.error('Error in voice-to-text processing:', error);
          throw error;
        }
      };
    };

    mediaRecorder.start();
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}