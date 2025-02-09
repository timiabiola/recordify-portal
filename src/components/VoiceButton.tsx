
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { RecordingAnimation } from './RecordingAnimation';
import { toast } from 'sonner';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  const isMobile = useIsMobile();
  const { startRecording, stopRecording } = useAudioRecorder(isRecording, setIsRecording);

  const handleClick = async () => {
    try {
      console.log('[VoiceButton] Handle click triggered', { isRecording, isMobile });
      
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Audio recording is not supported in this browser');
        return;
      }

      if (!isRecording) {
        await startRecording();
      } else {
        await stopRecording();
      }
    } catch (error) {
      console.error('[VoiceButton] Error handling click:', error);
      setIsRecording(false);
      toast.error('Failed to access microphone. Please check your permissions.');
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <div 
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            void handleClick();
          }
        }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
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
