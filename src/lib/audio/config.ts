export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: 44100 }, // Standard WAV sample rate
  channelCount: { ideal: 1 }
};

export const RECORDER_OPTIONS = {
  audioBitsPerSecond: 128000,
  mimeType: 'audio/wav'
};

export const AUDIO_FORMAT = {
  type: 'audio/wav',
  extension: 'wav'
} as const;