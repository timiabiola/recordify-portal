import { toast } from "sonner";

export const handleRecordingError = (error: unknown) => {
  console.error('Recording error:', error);
  toast.error('Could not access microphone. Please check permissions.');
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