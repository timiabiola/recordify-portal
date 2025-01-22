import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS } from "./config";
import { toast } from "sonner";

export const initializeRecorder = async (isMobile?: boolean) => {
  try {
    const mobileConstraints = isMobile ? {
      channelCount: 1,
      sampleRate: 44100,
      sampleSize: 16
    } : {};

    console.log('Getting user media with constraints:', {
      ...AUDIO_CONSTRAINTS,
      ...mobileConstraints
    });
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        ...AUDIO_CONSTRAINTS,
        ...mobileConstraints,
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

    // Try different MIME types for better mobile compatibility
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];

    let selectedMimeType = null;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      console.error('No supported MIME type found');
      throw new Error('Audio recording is not supported in this browser');
    }

    console.log('Selected MIME type:', selectedMimeType);
    
    const recorderOptions = {
      ...RECORDER_OPTIONS,
      mimeType: selectedMimeType,
      // Lower bitrate for mobile
      audioBitsPerSecond: isMobile ? 64000 : 128000
    };

    const recorder = new MediaRecorder(stream, recorderOptions);
    console.log('MediaRecorder initialized with options:', recorderOptions);

    return { recorder, stream };
  } catch (error) {
    console.error('Error initializing recorder:', error);
    toast.error('Failed to initialize audio recording. Please check your microphone permissions.');
    throw error;
  }
};