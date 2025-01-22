import { toast } from 'sonner';

export const setupRecorderEvents = (
  recorder: MediaRecorder,
  chunks: Blob[],
  onStop: (chunks: Blob[], mimeType: string) => Promise<void>,
  cleanupFn: () => void,
  setIsRecording: (isRecording: boolean) => void
) => {
  recorder.ondataavailable = (e) => {
    console.log('[Audio Recorder] Data available:', {
      size: e.data.size,
      type: e.data.type
    });
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.onstop = async () => {
    console.log('[Audio Recorder] Recording stopped, processing chunks:', chunks.length);
    if (chunks.length > 0) {
      await onStop(chunks, recorder.mimeType);
    } else {
      console.error('[Audio Recorder] No audio data recorded');
      toast.error('No audio data recorded. Please try again.');
    }
    cleanupFn();
  };

  recorder.onerror = (event) => {
    console.error('[Audio Recorder] Recorder error:', event);
    cleanupFn();
    setIsRecording(false);
    toast.error('Recording error occurred. Please try again.');
  };
};