export interface AudioRecorderHook {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export interface RecordingHandlers {
  handleDataAvailable: (chunks: Blob[], event: BlobEvent) => void;
  handleRecordingStop: (chunks: Blob[], mimeType: string) => void;
}