export const AUDIO_CONFIG = {
  MIME_TYPE: 'audio/webm;codecs=opus',
  CONSTRAINTS: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
} as const;