export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: 48000 },
  channelCount: { ideal: 1 }
};

export const RECORDER_OPTIONS = {
  audioBitsPerSecond: 128000,
  mimeType: 'audio/webm'
};

export const AUDIO_FORMAT = {
  type: 'audio/webm',
  extension: 'webm'
} as const;