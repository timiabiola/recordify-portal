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
      console.log('Starting recording process...');
      
      // Clean up any existing recorder
      if (mediaRecorderRef.current) {
        console.log('Cleaning up existing recorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
      
      const recorder = await startRecording({ isRecording, setIsRecording });
      mediaRecorderRef.current = recorder;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error in handleStartRecording:', error);
      setIsRecording(false);
      toast.error('Failed to start recording. Please check your microphone permissions.');
    }
  }, [isRecording, setIsRecording]);

  const handleStopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setIsRecording(false);
      console.log('Recording stopped successfully');
    }
  }, [setIsRecording]);

  return {
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  };
};