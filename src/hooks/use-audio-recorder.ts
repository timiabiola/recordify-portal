import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { AudioRecorderHook, AudioRecorderState } from '@/lib/audio/types';
import { getAudioConstraints, initializeMediaStream, createMediaRecorder } from '@/lib/audio/initializeRecorder';
import { handleRecordingError } from '@/lib/audio/handleErrors';
import { createRecordingHandlers } from '@/lib/audio/handlers';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const recorderState = useRef<AudioRecorderState>({
    mediaRecorder: null,
    chunks: []
  });

  const cleanupRecorder = useCallback(() => {
    if (recorderState.current.mediaRecorder) {
      const currentRecorder = recorderState.current.mediaRecorder;
      
      if (currentRecorder.state !== 'inactive') {
        currentRecorder.stop();
      }
      
      currentRecorder.stream.getTracks().forEach(track => {
        track.stop();
        console.log('[Audio Recorder] Cleaned up track:', track.kind);
      });
      
      recorderState.current.mediaRecorder = null;
      recorderState.current.chunks = [];
    }
  }, []);

  const handleStartRecording = useCallback(async (): Promise<void> => {
    try {
      cleanupRecorder();

      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      const constraints = getAudioConstraints(isMobile);
      
      console.log('[Audio Recorder] Starting recording...', {
        userAgent,
        isMobile,
        constraints
      });

      const stream = await initializeMediaStream(constraints);
      const recorder = createMediaRecorder(stream, isMobile);
      const handlers = createRecordingHandlers();

      recorder.ondataavailable = (e) => {
        console.log('[Audio Recorder] Data available:', {
          size: e.data.size,
          type: e.data.type
        });
        handlers.handleDataAvailable(recorderState.current.chunks, e);
      };

      recorder.onstop = async () => {
        console.log('[Audio Recorder] Recording stopped');
        await handlers.handleRecordingStop(recorderState.current.chunks, recorder.mimeType);
        cleanupRecorder();
      };

      recorder.onerror = (event) => {
        console.error('[Audio Recorder] Recorder error:', event);
        cleanupRecorder();
        setIsRecording(false);
        toast.error('Recording error occurred. Please try again.');
      };

      recorderState.current.mediaRecorder = recorder;
      recorder.start(isMobile ? 500 : 1000);
      setIsRecording(true);

    } catch (error) {
      console.error('[Audio Recorder] Start recording error:', error);
      cleanupRecorder();
      setIsRecording(false);
      handleRecordingError(error);
    }
  }, [cleanupRecorder, setIsRecording]);

  const handleStopRecording = useCallback(async (): Promise<void> => {
    try {
      console.log('[Audio Recorder] Stopping recording...');
      
      if (recorderState.current.mediaRecorder?.state === 'recording') {
        recorderState.current.mediaRecorder.stop();
      }
      
      setIsRecording(false);
    } catch (error) {
      console.error('[Audio Recorder] Stop recording error:', error);
      cleanupRecorder();
      setIsRecording(false);
      handleRecordingError(error);
    }
  }, [cleanupRecorder, setIsRecording]);

  return {
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  };
};