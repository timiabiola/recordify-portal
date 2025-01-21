import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const startRecording = async ({ 
  isRecording, 
  setIsRecording 
}: { 
  isRecording: boolean; 
  setIsRecording: (isRecording: boolean) => void;
}) => {
  if (isRecording) {
    console.warn('Recording already in progress');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    console.log('Audio stream created:', stream);
    
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Received audio chunk:', {
          size: event.data.size,
          type: event.data.type
        });
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      try {
        console.log('Recording stopped, processing audio chunks...');
        
        if (audioChunks.length === 0) {
          console.error('No audio data recorded');
          throw new Error('No audio data recorded');
        }
        
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        console.log('Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        
        reader.onloadend = async () => {
          try {
            const base64Audio = reader.result as string;
            console.log('Audio converted to base64, length:', base64Audio.length);

            // Call Supabase Edge Function instead of /api endpoint
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio.split(',')[1] }
            });

            if (error) {
              console.error('Error calling voice-to-text function:', error);
              throw error;
            }

            console.log('Voice-to-text response:', data);
            toast.success('Audio processed successfully!');

          } catch (error) {
            console.error('Error processing audio:', error);
            toast.error('Failed to process audio. Please try again.');
          }
        };

        reader.onerror = (error) => {
          console.error('Error reading audio file:', error);
          toast.error('Failed to read audio file. Please try again.');
        };

      } catch (error) {
        console.error('Error in onstop handler:', error);
        toast.error('An error occurred while processing the recording.');
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      toast.error('Recording error occurred. Please try again.');
      setIsRecording(false);
    };

    // Start recording
    mediaRecorder.start();
    console.log('Started recording with MediaRecorder');
    setIsRecording(true);
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    toast.error('Could not access microphone. Please check permissions.');
    setIsRecording(false);
    return null;
  }
};