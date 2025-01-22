import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { RecordingAnimation } from './RecordingAnimation';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  const isMobile = useIsMobile();
  const { startRecording, stopRecording } = useAudioRecorder(isRecording, setIsRecording);

  const handleClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
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

      <div onClick={handleClick}>
        <RecordingAnimation isRecording={isRecording} isMobile={isMobile} />
      </div>
      
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