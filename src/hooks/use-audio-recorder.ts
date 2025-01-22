import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAudioRecorder = (isRecording: boolean, setIsRecording: (isRecording: boolean) => void) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        console.log('Cleaning up MediaRecorder on unmount');
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const processAudioData = async (base64Audio: string) => {
    try {
      console.log('Processing audio data...');
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio.split(',')[1] }
      });

      if (error) throw error;
      console.log('Voice-to-text response:', data);
      
      if (data?.success && data?.expenses) {
        toast({
          title: "Success",
          description: "Expenses recorded successfully!"
        });
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data?.error || 'Failed to process expense'
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to process audio. Please try again.'
      });
    }
  };

  const handleDataAvailable = (chunks: Blob[], event: BlobEvent) => {
    if (event.data.size > 0) {
      console.log('Received audio chunk:', event.data.size, 'bytes');
      chunks.push(event.data);
    }
  };

  const handleRecordingStop = async (chunks: Blob[], mimeType: string) => {
    console.log('Recording stopped, processing chunks...');
    const audioBlob = new Blob(chunks, { type: mimeType });
    console.log('Audio blob created:', audioBlob.size, 'bytes');
    
    if (audioBlob.size < 100) {
      toast({
        variant: "destructive",
        title: "Recording too short",
        description: "Please record a longer message"
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      await processAudioData(base64Audio);
    };
  };

  const startRecording = async () => {
    try {
      // First check if permission is already granted
      const permissionResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Current microphone permission status:', permissionResult.state);

      if (mediaRecorderRef.current) {
        console.log('Cleaning up existing MediaRecorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Request microphone access with specific constraints for mobile
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 }
        }
      });

      // Verify that we have an active audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || !audioTrack.enabled) {
        throw new Error('No active audio track available');
      }
      
      console.log('Audio track settings:', audioTrack.getSettings());

      // Try different MIME types for better mobile compatibility
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];

      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      if (!selectedMimeType) {
        console.warn('No preferred MIME types supported, using default');
      }

      console.log('Selected MIME type:', selectedMimeType);

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => handleDataAvailable(chunks, e);
      recorder.onstop = () => handleRecordingStop(chunks, selectedMimeType || 'audio/webm');

      recorder.start(1000);
      console.log('Started recording with MIME type:', selectedMimeType);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      
      // Provide more specific error messages for common mobile issues
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast({
            variant: "destructive",
            title: "Microphone access denied",
            description: 'Please allow microphone access in your browser settings.'
          });
        } else if (error.name === 'NotFoundError') {
          toast({
            variant: "destructive",
            title: "No microphone found",
            description: 'Please ensure your device has a working microphone.'
          });
        } else {
          toast({
            variant: "destructive",
            title: "Recording failed",
            description: `${error.name}: ${error.message}`
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Recording failed",
          description: 'Please check your microphone permissions.'
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  return {
    startRecording,
    stopRecording
  };
};