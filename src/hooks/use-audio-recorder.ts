import { useRef, useCallback } from 'react';
import type { AudioRecorderHook } from '@/lib/audio/types';
import { getAudioConstraints, initializeMediaStream, createMediaRecorder } from '@/lib/audio/initializeRecorder';
import { handleRecordingError } from '@/lib/audio/handleErrors';
import { createRecordingHandlers } from '@/lib/audio/handlers';
import { createRecorderState, cleanupRecorderState } from '@/lib/audio/recorder-state';
import { setupRecorderEvents } from '@/lib/audio/recorder-events';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const recorderState = useRef(createRecorderState());

  const cleanupRecorder = useCallback(() => {
    console.log('[Audio Recorder] Cleaning up recorder state');
    cleanupRecorderState(recorderState.current);
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

      setupRecorderEvents(
        recorder,
        recorderState.current.chunks,
        handlers.handleRecordingStop,
        cleanupRecorder,
        setIsRecording
      );

      recorderState.current.mediaRecorder = recorder;
      recorder.start(500); // Consistent smaller chunk size for better handling
      setIsRecording(true);

      console.log('[Audio Recorder] Recording started successfully', {
        state: recorder.state,
        mimeType: recorder.mimeType
      });

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
        console.log('[Audio Recorder] Recorder stopped');
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