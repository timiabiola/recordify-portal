import { initializeRecorder } from "./audio/recorder";
import { createRecordingHandlers } from "./audio/handlers";
import { handleRecordingError } from "./audio/errorHandling";

interface StartRecordingProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const startRecording = async ({ isRecording, setIsRecording }: StartRecordingProps) => {
  try {
    const { recorder, stream } = await initializeRecorder();
    const handlers = createRecordingHandlers();
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => handlers.handleDataAvailable(chunks, e);
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      handlers.handleRecordingStop(chunks, recorder.mimeType);
    };

    recorder.start(1000);
    console.log('Started recording');
    setIsRecording(true);
    
    return recorder;
  } catch (error) {
    handleRecordingError(error);
    setIsRecording(false);
    throw error;
  }
};