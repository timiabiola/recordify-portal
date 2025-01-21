export interface AudioRecorderConfig {
  sampleRate: number;
  channelCount: number;
  audioBitsPerSecond: number;
}

export interface AudioRecorderState {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}