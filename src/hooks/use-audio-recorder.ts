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
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      
      console.log('[AudioRecorder Hook] Starting recording process...', {
        browser: userAgent,
        platform: navigator.platform,
        isMobile,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        mimeTypes: {
          webm: MediaRecorder.isTypeSupported('audio/webm'),
          wav: MediaRecorder.isTypeSupported('audio/wav'),
          mp4: MediaRecorder.isTypeSupported('audio/mp4'),
        }
      });
      
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
      
      const recorder = await startRecording({ isRecording, setIsRecording, isMobile });
      mediaRecorderRef.current = recorder;
      console.log('[AudioRecorder Hook] Recording started successfully', {
        state: recorder.state,
        mimeType: recorder.mimeType
      });
    } catch (error) {
      console.error('[AudioRecorder Hook] Error in handleStartRecording:', error);
      setIsRecording(false);
      
      // More specific error messages based on the error type
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            toast.error('Microphone access denied. Please check your browser settings and permissions.');
            break;
          case 'NotFoundError':
            toast.error('No microphone found. Please ensure your device has a working microphone.');
            break;
          case 'NotReadableError':
            toast.error('Could not access microphone. Please try closing other apps using the microphone.');
            break;
          case 'SecurityError':
            toast.error('Security error accessing microphone. Please ensure you\'re using HTTPS.');
            break;
          case 'AbortError':
            toast.error('Recording was interrupted. Please try again.');
            break;
          default:
            toast.error(`Recording failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to start recording. Please check your microphone permissions.');
      }
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