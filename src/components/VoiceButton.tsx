import React, { useRef } from 'react';
import { Mic } from 'lucide-react';
import { startRecording } from '@/lib/audioRecording';
import { toast } from 'sonner';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleClick = async () => {
    try {
      if (!isRecording) {
        console.log('Starting recording...');
        // Stop any existing recording first
        if (mediaRecorderRef.current) {
          console.log('Cleaning up existing MediaRecorder...');
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind);
            track.stop();
          });
        }
        
        console.log('Initializing new MediaRecorder...');
        mediaRecorderRef.current = await startRecording(setIsRecording);
        console.log('MediaRecorder state after initialization:', mediaRecorderRef.current.state);
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
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            toast.error('Please allow microphone access to record expenses');
            break;
          case 'NotFoundError':
            toast.error('No microphone found. Please check your device settings');
            break;
          case 'NotReadableError':
            toast.error('Could not access your microphone. Please check if another app is using it');
            break;
          case 'SecurityError':
            toast.error('Recording is only allowed on secure (HTTPS) connections');
            break;
          default:
            toast.error(`Failed to start recording: ${error.message}`);
        }
      } else {
        toast.error('Failed to start recording. Please try again');
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating helper text */}
      <div className={`absolute -top-12 transition-opacity duration-300 ${
        isRecording ? 'opacity-0' : 'opacity-100'
      }`}>
        <p className="text-sm text-muted-foreground bg-background/90 px-4 py-2 rounded-full shadow-sm">
          Tap to record your expense
        </p>
      </div>

      {/* Pulsing background */}
      <div className={`absolute inset-0 rounded-full bg-primary opacity-20 transition-transform duration-1000 ${
        isRecording ? 'scale-[1.3] animate-pulse' : 'scale-100'
      }`}></div>
      
      {/* Main button */}
      <button
        onClick={handleClick}
        className={`relative z-10 rounded-full p-10 shadow-lg transition-all duration-300 ${
          isRecording 
            ? 'bg-destructive scale-105 hover:bg-destructive/90' 
            : 'bg-primary hover:bg-primary/90'
        }`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic className={`w-14 h-14 text-primary-foreground ${isRecording ? 'animate-pulse' : ''}`} />
      </button>
      
      {/* Status text */}
      <div className="mt-6 text-center">
        <p className={`text-lg font-medium ${isRecording ? 'text-destructive' : 'text-muted-foreground'}`}>
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