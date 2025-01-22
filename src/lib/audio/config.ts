export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: 16000 },
  channelCount: { ideal: 1 }
};

export const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
] as const;

export const RECORDER_OPTIONS = {
  audioBitsPerSecond: 128000
};

export const getSupportedMimeType = (): string => {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  console.warn('No preferred MIME types supported, using default');
  return '';
};