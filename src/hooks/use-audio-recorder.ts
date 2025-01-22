import { useRef } from 'react';
import { startRecording } from '@/lib/audioRecording';
import type { AudioRecorderHook } from '@/lib/audio/types';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartRecording = async () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      const recorder = await startRecording({ isRecording, setIsRecording });
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.error('Error in handleStartRecording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return {
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording
  };
};