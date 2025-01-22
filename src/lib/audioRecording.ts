import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleRecordingError, handleEmptyRecordingError, handleShortRecordingError } from './audio/errorHandling';
import { getSupportedMimeType, AUDIO_CONSTRAINTS } from './audio/config';

interface StartRecordingOptions {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  options?: MediaRecorderOptions;
}

export async function startRecording({ isRecording, setIsRecording, options }: StartRecordingOptions) {
  try {
    console.log('Starting recording...');
    
    const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    console.log('Current microphone permission status:', permissionResult.state);

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: AUDIO_CONSTRAINTS
    });
    
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    console.log('Audio track settings:', audioTrack.getSettings());
    
    const supportedMimeType = 'audio/wav';
    console.log('Selected MIME type:', supportedMimeType);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
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
        handleEmptyRecordingError();
        return;
      }

      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      console.log('Audio blob created:', audioBlob.size, 'bytes');
      
      if (audioBlob.size < 100) {
        handleShortRecordingError();
        return;
      }
      
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
    handleRecordingError(error);
    throw error;
  }
}