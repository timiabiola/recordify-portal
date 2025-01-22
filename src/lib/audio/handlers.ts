import { toast } from "sonner";
import { handleEmptyRecordingError, handleShortRecordingError } from "./errorHandling";
import { AUDIO_FORMAT } from "./config";
import { submitExpenseAudio } from "../expenseService";

export const createRecordingHandlers = () => {
  const handleDataAvailable = (chunks: Blob[], event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      console.log('[Audio Handlers] Data chunk received:', {
        size: event.data.size,
        type: event.data.type,
        totalChunks: chunks.length
      });
    }
  };

  const handleRecordingStop = async (chunks: Blob[], mimeType: string) => {
    try {
      console.log('[Audio Handlers] Processing recording:', {
        chunks: chunks.length,
        mimeType,
        totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      });

      if (chunks.length === 0) {
        console.error('[Audio Handlers] No chunks available');
        handleEmptyRecordingError();
        return;
      }

      const audioBlob = new Blob(chunks, { type: AUDIO_FORMAT.type });
      console.log('[Audio Handlers] Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      if (audioBlob.size < 100) {
        console.error('[Audio Handlers] Audio too short:', audioBlob.size, 'bytes');
        handleShortRecordingError();
        return;
      }

      console.log('[Audio Handlers] Submitting audio for processing...');
      await submitExpenseAudio(audioBlob);
      console.log('[Audio Handlers] Audio submitted successfully');

    } catch (error) {
      console.error('[Audio Handlers] Error processing audio:', error);
      toast.error('Failed to process recording. Please try again.');
      throw error; // Propagate error for proper handling
    }
  };

  return {
    handleDataAvailable,
    handleRecordingStop
  };
};