import { SUPPORTED_MIME_TYPES } from './config';

export const getSupportedMimeType = (): string => {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  console.warn('No preferred MIME types supported, using default');
  return '';
};

export const validateAudioTrack = (stream: MediaStream) => {
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack || !audioTrack.enabled) {
    throw new Error('No active audio track available');
  }
  console.log('Audio track settings:', audioTrack.getSettings());
  return audioTrack;
};