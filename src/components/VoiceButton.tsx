import React, { useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { startRecording } from '@/lib/audioRecording';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isMobile = useIsMobile();

  // Cleanup function for when component unmounts
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
        
        mediaRecorderRef.current = await startRecording({ isRecording, setIsRecording });
      } else {
        console.log('Stopping recording...');
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
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating helper text - hidden on mobile */}
      {!isMobile && (
        <div className={`absolute -top-12 transition-opacity duration-300 ${
          isRecording ? 'opacity-0' : 'opacity-100'
        }`}>
          <p className="text-sm text-muted-foreground bg-background/90 px-4 py-2 rounded-full shadow-sm">
            Tap to record your expense
          </p>
        </div>
      )}

      {/* Pulsing background */}
      <div className={`absolute inset-0 rounded-full bg-primary opacity-20 transition-transform duration-1000 ${
        isRecording ? 'scale-[1.3] animate-pulse' : 'scale-100'
      }`}></div>
      
      {/* Main button - adjusted size for mobile */}
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
      
      {/* Status text */}
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