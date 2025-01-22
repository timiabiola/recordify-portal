import { useRef, useCallback } from 'react';
import { startRecording } from '@/lib/audioRecording';
import type { AudioRecorderHook } from '@/lib/audio/types';
import { toast } from 'sonner';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartRecording = useCallback(async () => {
    try {
      console.log('[AudioRecorder Hook] Starting recording process...');
      
      // Clean up any existing recorder
      if (mediaRecorderRef.current) {
        console.log('[AudioRecorder Hook] Cleaning up existing recorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          console.log('[AudioRecorder Hook] Stopped track:', track.kind, {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });
      }
      
      const recorder = await startRecording({ isRecording, setIsRecording });
      mediaRecorderRef.current = recorder;
      console.log('[AudioRecorder Hook] Recording started successfully');
    } catch (error) {
      console.error('[AudioRecorder Hook] Error in handleStartRecording:', error);
      setIsRecording(false);
      toast.error('Failed to start recording. Please check your microphone permissions.');
    }
  }, [isRecording, setIsRecording]);

  const handleStopRecording = useCallback(() => {
    console.log('[AudioRecorder Hook] Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[AudioRecorder Hook] Current recorder state:', mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log('[AudioRecorder Hook] Stopped track:', track.kind, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });
      setIsRecording(false);
      console.log('[AudioRecorder Hook] Recording stopped successfully');
    } else {
      console.log('[AudioRecorder Hook] No active recorder to stop or already inactive');
    }
  }, [setIsRecording]);

  return {
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  };
};