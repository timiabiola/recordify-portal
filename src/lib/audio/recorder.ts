import { AUDIO_CONFIG } from './config';
import { handleRecordingError } from './errorHandling';
import type { AudioRecorderState } from './types';

export const initializeRecorder = async () => {
  console.log('Requesting microphone access...');
  
  if (!window.MediaRecorder) {
    throw new Error('MediaRecorder is not supported in this browser');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG.CONSTRAINTS);
    console.log('Microphone access granted, stream active:', stream.active);
    
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    return stream;
  } catch (error) {
    console.error('Error initializing recorder:', error);
    throw new Error('Could not access microphone. Please ensure microphone permissions are granted.');
  }
};

export const createRecorder = (
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
  onStop: () => void,
  onError: (event: Event) => void,
  state: AudioRecorderState
) => {
  // Check supported MIME types
  const getMimeType = () => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using supported MIME type:', type);
        return type;
      }
    }
    
    console.warn('No preferred MIME types supported, using default');
    return '';
  };

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: getMimeType()
  });

  console.log('MediaRecorder created with settings:', {
    mimeType: mediaRecorder.mimeType,
    state: mediaRecorder.state
  });

  mediaRecorder.ondataavailable = onDataAvailable;
  mediaRecorder.onstop = onStop;
  mediaRecorder.onerror = onError;

  return mediaRecorder;
};