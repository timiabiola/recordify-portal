import { AudioRecorderState } from './types';

export const createRecorderState = () => ({
  mediaRecorder: null,
  chunks: []
} as AudioRecorderState);

export const cleanupRecorderState = (state: AudioRecorderState) => {
  if (state.mediaRecorder) {
    const currentRecorder = state.mediaRecorder;
    
    if (currentRecorder.state !== 'inactive') {
      currentRecorder.stop();
    }
    
    currentRecorder.stream.getTracks().forEach(track => {
      track.stop();
      console.log('[Audio Recorder] Cleaned up track:', track.kind);
    });
    
    state.mediaRecorder = null;
    state.chunks = [];
  }
};