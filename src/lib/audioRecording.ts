import { initializeRecorder } from "./audio/recorder";
import { createRecordingHandlers } from "./audio/handlers";
import { handleRecordingError } from "./audio/errorHandling";
import { toast } from "sonner";

interface StartRecordingProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const startRecording = async ({ isRecording, setIsRecording }: StartRecordingProps) => {
  try {
    console.log('Initializing recording...');
    
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support audio recording');
    }

    // Request permissions first on mobile
    await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const { recorder, stream } = await initializeRecorder();
    const handlers = createRecordingHandlers();
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => handlers.handleDataAvailable(chunks, e);
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      handlers.handleRecordingStop(chunks, recorder.mimeType);
    };

    recorder.start(1000);
    console.log('Started recording successfully');
    setIsRecording(true);
    
    return recorder;
  } catch (error) {
    console.error('Error in startRecording:', error);
    handleRecordingError(error);
    setIsRecording(false);
    throw error;
  }
};