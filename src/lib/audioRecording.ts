import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StartRecordingOptions {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  options?: MediaRecorderOptions;
}

export async function startRecording({ isRecording, setIsRecording, options }: StartRecordingOptions) {
  try {
    console.log('Starting recording with options:', options);
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      ...options
    });
    
    console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log('Data available event:', event.data.size, 'bytes');
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio...');
      if (audioChunks.length === 0) {
        console.error('No audio data recorded');
        toast.error('No audio was recorded. Please try again.');
        return;
      }

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      console.log('Audio blob created:', audioBlob.size, 'bytes');
      
      if (audioBlob.size < 100) {
        console.error('Audio recording too short');
        toast.error('Recording was too short. Please try again.');
        return;
      }
      
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
            toast.error('Failed to process audio. Please try again.');
            throw error;
          }

          console.log('Voice-to-text response:', data);
          
          if (data?.success && data?.expenses) {
            toast.success('Expenses recorded successfully!');
            // Refresh the page to show new expenses
            window.location.reload();
          } else if (data?.error && data.error.includes('No audio detected')) {
            toast.error(data.error);
          } else {
            toast.error('Failed to process expenses. Please try again.');
          }
        } catch (error) {
          console.error('Error in voice-to-text processing:', error);
          toast.error('Failed to process audio. Please try again.');
        }
      };
    };

    mediaRecorder.start();
    console.log('MediaRecorder started');
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    toast.error('Could not access microphone. Please check permissions.');
    throw error;
  }
}