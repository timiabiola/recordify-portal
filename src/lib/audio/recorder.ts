import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS, AUDIO_FORMAT } from "./config";
import { toast } from "sonner";

export const initializeRecorder = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    const audioTrack = stream.getAudioTracks()[0];
    
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    console.log('Audio track settings:', audioTrack.getSettings());

    const recorder = new MediaRecorder(stream, {
      ...RECORDER_OPTIONS,
      mimeType: AUDIO_FORMAT.type
    });

    return { recorder, stream };
  } catch (error) {
    console.error('Error initializing recorder:', error);
    toast.error('Failed to initialize audio recording');
    throw error;
  }
};