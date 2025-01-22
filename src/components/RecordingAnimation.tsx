import React from 'react';
import { Mic } from 'lucide-react';

interface RecordingAnimationProps {
  isRecording: boolean;
  isMobile: boolean;
}

export const RecordingAnimation: React.FC<RecordingAnimationProps> = ({ isRecording, isMobile }) => {
  return (
    <div className="relative">
      <div className={`absolute inset-0 rounded-full bg-primary opacity-20 transition-transform duration-1000 ${
        isRecording ? 'scale-[1.3] animate-pulse' : 'scale-100'
      }`} />
      
      <button
        type="button"
        className={`relative z-10 rounded-full ${
          isMobile ? 'p-8' : 'p-10'
        } shadow-lg transition-all duration-300 ${
          isRecording 
            ? 'bg-destructive scale-105 hover:bg-destructive/90 active:bg-destructive/80' 
            : 'bg-primary hover:bg-primary/90 active:bg-primary/80'
        }`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} text-primary-foreground ${
          isRecording ? 'animate-pulse' : ''
        }`} />
      </button>
    </div>
  );
};