import { toast } from "sonner";

export const handleRecordingError = (error: unknown) => {
  console.error('Recording error:', error);
  
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      toast.error('Microphone access was denied. Please grant microphone permissions in your browser settings.');
    } else if (error.name === 'NotFoundError') {
      toast.error('No microphone found. Please ensure your device has a working microphone.');
    } else {
      toast.error(error.message || 'Could not access microphone. Please check permissions.');
    }
  } else {
    toast.error('Could not access microphone. Please check permissions.');
  }
};

export const handleAudioProcessingError = (error: unknown) => {
  console.error('Audio processing error:', error);
  toast.error('Failed to process audio. Please try again.');
};

export const handleEmptyRecordingError = () => {
  console.error('No audio data recorded');
  toast.error('No audio was recorded. Please try again.');
};

export const handleShortRecordingError = () => {
  console.error('Audio recording too short');
  toast.error('Recording was too short. Please try again.');
};