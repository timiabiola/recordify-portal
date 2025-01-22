import { useRef } from 'react';
import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS, getSupportedMimeType } from '@/lib/audio/config';
import { handleRecordingError } from '@/lib/audio/errorHandling';
import { createRecordingHandlers } from '@/lib/audio/handlers';
import type { AudioRecorderHook } from '@/lib/audio/types';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const handlers = createRecordingHandlers();

  const startRecording = async () => {
    try {
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Current microphone permission status:', permissionResult.state);

      if (mediaRecorderRef.current) {
        console.log('Cleaning up existing MediaRecorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || !audioTrack.enabled) {
        throw new Error('No active audio track available');
      }
      console.log('Audio track settings:', audioTrack.getSettings());
      
      const selectedMimeType = getSupportedMimeType();
      console.log('Selected MIME type:', selectedMimeType);

      const recorder = new MediaRecorder(stream, {
        ...RECORDER_OPTIONS,
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => handlers.handleDataAvailable(chunks, e);
      recorder.onstop = () => handlers.handleRecordingStop(chunks, selectedMimeType || 'audio/webm');

      recorder.start(1000);
      console.log('Started recording with MIME type:', selectedMimeType);
      setIsRecording(true);
    } catch (error) {
      handleRecordingError(error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return {
    startRecording,
    stopRecording
  };
};