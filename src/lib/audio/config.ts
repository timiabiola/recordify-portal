export const AUDIO_CONFIG = {
  MIME_TYPE: 'audio/webm',  // Simplified MIME type
  CONSTRAINTS: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
} as const;