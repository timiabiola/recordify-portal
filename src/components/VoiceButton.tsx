import React, { useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { startRecording } from '@/lib/audioRecording';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isMobile = useIsMobile();
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

  const handleClick = async () => {
    try {
      if (!isRecording) {
        if (mediaRecorderRef.current) {
          console.log('Cleaning up existing MediaRecorder...');
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind);
            track.stop();
          });
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000 // Optimal for Whisper API
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
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log('Received audio chunk:', e.data.size, 'bytes');
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          console.log('Recording stopped, processing chunks...');
          const audioBlob = new Blob(chunks, { type: options.mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          
          if (audioBlob.size < 100) {
            console.error('Audio recording too short');
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
            console.log('Audio converted to base64, length:', base64Audio.length);
            
            try {
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
        };

        recorder.start(1000); // Collect data in 1-second chunks
        console.log('Started recording with options:', options);
        setIsRecording(true);
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          mediaRecorderRef.current = null;
          setIsRecording(false);
        }
      }
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

  return (
    <div className="relative flex flex-col items-center">
      {!isMobile && (
        <div className={`absolute -top-12 transition-opacity duration-300 ${
          isRecording ? 'opacity-0' : 'opacity-100'
        }`}>
          <p className="text-sm text-muted-foreground bg-background/90 px-4 py-2 rounded-full shadow-sm">
            Tap to record your expense
          </p>
        </div>
      )}

      <div className={`absolute inset-0 rounded-full bg-primary opacity-20 transition-transform duration-1000 ${
        isRecording ? 'scale-[1.3] animate-pulse' : 'scale-100'
      }`}></div>
      
      <button
        onClick={handleClick}
        className={`relative z-10 rounded-full ${
          isMobile ? 'p-8' : 'p-10'
        } shadow-lg transition-all duration-300 ${
          isRecording 
            ? 'bg-destructive scale-105 hover:bg-destructive/90' 
            : 'bg-primary hover:bg-primary/90'
        }`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} text-primary-foreground ${
          isRecording ? 'animate-pulse' : ''
        }`} />
      </button>
      
      <div className="mt-4 md:mt-6 text-center">
        <p className={`${isMobile ? 'text-base' : 'text-lg'} font-medium ${
          isRecording ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {isRecording ? 'Recording...' : 'Ready to Record'}
        </p>
        {isRecording && (
          <p className="text-sm text-muted-foreground mt-1">
            Tap again to stop
          </p>
        )}
      </div>
    </div>
  );
};