export interface AudioRecorderHook {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export interface RecordingHandlers {
  handleDataAvailable: (chunks: Blob[], event: BlobEvent) => void;
  handleRecordingStop: (chunks: Blob[], mimeType: string) => Promise<void>;
}

export interface AudioRecorderState {
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
}

export interface AudioConstraints {
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    channelCount?: number;
    sampleRate?: number;
    sampleSize?: number;
  };
}