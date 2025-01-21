export const DEFAULT_AUDIO_CONFIG = {
  sampleRate: 44100,
  channelCount: 1,
  audioBitsPerSecond: 128000,
};

export const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...DEFAULT_AUDIO_CONFIG,
  },
};