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
      if (mediaRecorderRef.current) {
        console.log('Cleaning up existing MediaRecorder...');
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error('Mime type not supported:', options.mimeType);
        throw new Error('Audio format not supported by your browser');
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => handleDataAvailable(chunks, e);
      recorder.onstop = () => handleRecordingStop(chunks, options.mimeType);

      recorder.start(1000);
      console.log('Started recording with options:', options);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: 'Please check your microphone permissions.'
      });
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