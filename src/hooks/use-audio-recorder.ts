import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { AUDIO_CONSTRAINTS, RECORDER_OPTIONS } from '@/lib/audio/config';
import { handleRecordingError } from '@/lib/audio/errorHandling';
import { getSupportedMimeType, validateAudioTrack } from '@/lib/audio/recorder';
import type { AudioRecorderHook, RecordingHandlers } from '@/lib/audio/types';

export const useAudioRecorder = (
  isRecording: boolean,
  setIsRecording: (isRecording: boolean) => void
): AudioRecorderHook => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handlers: RecordingHandlers = {
    handleDataAvailable: (chunks: Blob[], event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    },

    handleRecordingStop: async (chunks: Blob[], mimeType: string) => {
      try {
        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log('Recording stopped, blob size:', audioBlob.size);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        const formData = new FormData();
        formData.append('audio', audioBlob);

        const response = await fetch('/api/voice-to-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Voice processing result:', result);

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Processing failed",
            description: result.error || 'Failed to process voice recording'
          });
        }
      } catch (error) {
        console.error('Error processing recording:', error);
        toast({
          variant: "destructive",
          title: "Processing failed",
          description: 'Failed to process your recording'
        });
      }
    }
  };

  const startRecording = async () => {
    try {
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Current microphone permission status:', permissionResult.state);

      if (mediaRecorderRef.current) {
        console.log('Cleaning up existing MediaRecorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
      validateAudioTrack(stream);
      
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