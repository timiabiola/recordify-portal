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
      console.log('[Audio Recorder] Chunk added, total chunks:', chunks.length);
    }
  };

  recorder.onstop = async () => {
    console.log('[Audio Recorder] Recording stopped, processing chunks:', {
      totalChunks: chunks.length,
      sizes: chunks.map(chunk => chunk.size),
      types: chunks.map(chunk => chunk.type),
      timestamp: new Date().toISOString()
    });
    
    try {
      // Ensure we have valid audio data
      if (chunks.length === 0) {
        console.error('[Audio Recorder] No chunks recorded');
        toast.error('No audio recorded. Please try again.');
        cleanupFn();
        return;
      }

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log('[Audio Recorder] Total audio size:', totalSize, 'bytes');

      if (totalSize < 100) {
        console.error('[Audio Recorder] Audio data too small:', totalSize, 'bytes');
        toast.error('Recording too short. Please try again.');
        cleanupFn();
        return;
      }

      // Create a test blob to verify data integrity
      const testBlob = new Blob(chunks, { type: recorder.mimeType });
      if (!testBlob.size) {
        throw new Error('Invalid audio data');
      }

      console.log('[Audio Recorder] Processing audio with mime type:', recorder.mimeType);
      await onStop(chunks, recorder.mimeType);
      console.log('[Audio Recorder] Audio processing completed successfully');
      
    } catch (error) {
      console.error('[Audio Recorder] Error processing recording:', error);
      toast.error('Failed to process recording. Please try again.');
    } finally {
      cleanupFn();
      setIsRecording(false);
    }
  };

  recorder.onerror = (event) => {
    console.error('[Audio Recorder] Recorder error:', event);
    toast.error('Recording error occurred. Please try again.');
    cleanupFn();
    setIsRecording(false);
  };
};