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
    
    // Check for no audio or silence
    const hasAudioData = chunks.some(chunk => chunk.size > 0);
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    console.log('[Audio Recorder] Audio data check:', {
      hasAudioData,
      totalSize,
      chunksLength: chunks.length
    });

    if (!hasAudioData || totalSize < 1000) { // Check for minimal audio data
      console.log('[Audio Recorder] No audio detected or silence');
      toast.error('No audio detected. Please try again.');
      cleanupFn();
      return;
    }

    if (chunks.length > 0) {
      await onStop(chunks, recorder.mimeType);
    } else {
      console.error('[Audio Recorder] No audio data recorded');
      toast.error('No audio detected. Please try again.');
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