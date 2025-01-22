export const AUDIO_CONFIG = {
  MIME_TYPES: [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ],
  CONSTRAINTS: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
} as const;

export const getSupportedMimeType = () => {
  for (const mimeType of AUDIO_CONFIG.MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log('Using supported MIME type:', mimeType);
      return mimeType;
    }
  }
  console.warn('No preferred MIME types supported, using default');
  return '';
};