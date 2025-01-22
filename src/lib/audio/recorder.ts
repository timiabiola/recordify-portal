import { AUDIO_CONFIG } from './config';
import { handleRecordingError } from './errorHandling';
import type { AudioRecorderState } from './types';

export const initializeRecorder = async () => {
  console.log('Requesting microphone access...');
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('MediaDevices API is not supported in this browser');
  }

  try {
    // First check if permission is already granted
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    console.log('Microphone permission status:', permissionStatus.state);

    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG.CONSTRAINTS);
    console.log('Microphone access granted, stream active:', stream.active);
    
    const audioTrack = stream.getAudioTracks()[0];
    console.log('Audio track settings:', audioTrack.getSettings());
    
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    return stream;
  } catch (error: any) {
    console.error('Error initializing recorder:', error);
    // Provide more specific error messages based on the error type
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Microphone access was denied. Please grant microphone permissions in your browser settings.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No microphone found. Please ensure your device has a working microphone.');
    } else {
      throw new Error('Could not access microphone. Please ensure microphone permissions are granted.');
    }
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