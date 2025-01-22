import { toast } from "sonner";
import { handleEmptyRecordingError, handleShortRecordingError } from "./errorHandling";
import { AUDIO_FORMAT } from "./config";

export const createRecordingHandlers = () => {
  const handleDataAvailable = (chunks: Blob[], event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const handleRecordingStop = async (chunks: Blob[], mimeType: string) => {
    try {
      if (chunks.length === 0) {
        handleEmptyRecordingError();
        return;
      }

      const audioBlob = new Blob(chunks, { type: AUDIO_FORMAT.type });
      console.log('Audio blob created:', audioBlob.size, 'bytes');
      
      if (audioBlob.size < 100) {
        handleShortRecordingError();
        return;
      }

      // Convert to base64 and send to server
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const audioData = base64Audio.split(',')[1];
        
        try {
          const response = await fetch('/api/voice-to-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: audioData })
          });

          if (!response.ok) {
            throw new Error('Failed to process audio');
          }

          const data = await response.json();
          console.log('Server response:', data);
          
          toast.success('Recording processed successfully');
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error('Failed to process recording');
        }
      };
    } catch (error) {
      console.error('Error in handleRecordingStop:', error);
      toast.error('Error processing recording');
    }
  };

  return {
    handleDataAvailable,
    handleRecordingStop
  };
};