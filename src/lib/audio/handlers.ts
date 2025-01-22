import { toast } from "sonner";
import { handleEmptyRecordingError, handleShortRecordingError } from "./errorHandling";
import { AUDIO_FORMAT } from "./config";
import { submitExpenseAudio } from "../expenseService";

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

      try {
        await submitExpenseAudio(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process recording');
      }
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