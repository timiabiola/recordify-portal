import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS } from "./config";
import { toast } from "sonner";

export const initializeRecorder = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
    const audioTrack = stream.getAudioTracks()[0];
    
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    console.log('Audio track settings:', audioTrack.getSettings());

    // Check if the MIME type is supported
    if (!MediaRecorder.isTypeSupported(RECORDER_OPTIONS.mimeType)) {
      console.error('MIME type not supported:', RECORDER_OPTIONS.mimeType);
      throw new Error(`MIME type ${RECORDER_OPTIONS.mimeType} is not supported`);
    }

    const recorder = new MediaRecorder(stream, RECORDER_OPTIONS);
    console.log('MediaRecorder initialized with options:', RECORDER_OPTIONS);

    return { recorder, stream };
  } catch (error) {
    console.error('Error initializing recorder:', error);
    toast.error('Failed to initialize audio recording');
    throw error;
  }
};