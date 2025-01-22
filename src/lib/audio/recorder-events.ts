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
      type: e.data.type,
      timestamp: new Date().toISOString()
    });
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.onstop = async () => {
    console.log('[Audio Recorder] Recording stopped, processing chunks:', {
      totalChunks: chunks.length,
      sizes: chunks.map(chunk => chunk.size),
      types: chunks.map(chunk => chunk.type)
    });
    
    // Check for no audio or silence
    const hasAudioData = chunks.some(chunk => chunk.size > 0);
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    console.log('[Audio Recorder] Audio data check:', {
      hasAudioData,
      totalSize,
      chunksLength: chunks.length
    });

    if (!hasAudioData || totalSize < 100) {
      console.log('[Audio Recorder] No audio detected or silence');
      toast.error('No audio detected. Please try again.');
      cleanupFn();
      return;
    }

    if (chunks.length > 0) {
      try {
        await onStop(chunks, recorder.mimeType);
      } catch (error) {
        console.error('[Audio Recorder] Error processing chunks:', error);
        toast.error('Error processing recording. Please try again.');
      }
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