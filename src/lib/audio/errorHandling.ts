import { toast } from 'sonner';

export const handleAudioError = (error: unknown) => {
  console.error('Recording error:', error);
  
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        toast.error('Please allow microphone access to record expenses');
        break;
      case 'NotFoundError':
        toast.error('No microphone found. Please check your device settings');
        break;
      case 'NotReadableError':
        toast.error('Could not access microphone. Please check if another app is using it');
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
  
  throw error;
};