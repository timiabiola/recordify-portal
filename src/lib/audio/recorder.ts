import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS } from "./config";
import { toast } from "sonner";

export const initializeRecorder = async () => {
  try {
    console.log('Getting user media with constraints:', AUDIO_CONSTRAINTS);
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        ...AUDIO_CONSTRAINTS,
        // Add specific mobile constraints
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    
    const audioTrack = stream.getAudioTracks()[0];
    
    if (!audioTrack || !audioTrack.enabled) {
      console.error('No active audio track available');
      throw new Error('No active audio track available');
    }
    
    console.log('Audio track settings:', audioTrack.getSettings());
    console.log('Audio track constraints:', audioTrack.getConstraints());

    // Check if the MIME type is supported
    if (!MediaRecorder.isTypeSupported(RECORDER_OPTIONS.mimeType)) {
      console.error('MIME type not supported:', RECORDER_OPTIONS.mimeType);
      // Fallback to a more widely supported format
      RECORDER_OPTIONS.mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(RECORDER_OPTIONS.mimeType)) {
        throw new Error('Audio recording is not supported in this browser');
      }
    }

    const recorder = new MediaRecorder(stream, RECORDER_OPTIONS);
    console.log('MediaRecorder initialized with options:', RECORDER_OPTIONS);

    return { recorder, stream };
  } catch (error) {
    console.error('Error initializing recorder:', error);
    toast.error('Failed to initialize audio recording. Please check your microphone permissions.');
    throw error;
  }
};