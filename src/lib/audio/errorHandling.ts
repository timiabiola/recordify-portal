import { toast } from "sonner";

export const handleRecordingError = (error: unknown) => {
  console.error('Recording error:', error);

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        toast.error('Please allow microphone access in your browser settings.');
        break;
      case 'NotFoundError':
        toast.error('Please ensure your device has a working microphone.');
        break;
      default:
        toast.error(`${error.name}: ${error.message}`);
    }
  } else {
    toast.error('Please check your microphone permissions.');
  }
};

export const handleEmptyRecordingError = () => {
  console.error('Empty recording detected');
  toast.error('No audio was recorded. Please try again.');
};

export const handleShortRecordingError = () => {
  console.error('Recording too short');
  toast.error('Recording was too short. Please speak for longer.');
};