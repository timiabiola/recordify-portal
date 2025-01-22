import { toast } from "sonner";

export const handleRecordingError = (error: unknown): void => {
  console.error('[Audio Recorder] Recording error:', error);

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        toast.error('Microphone access denied. Please check your browser settings and permissions.');
        break;
      case 'NotFoundError':
        toast.error('No microphone found. Please ensure your device has a working microphone.');
        break;
      case 'NotReadableError':
        toast.error('Could not access microphone. Please try closing other apps using the microphone.');
        break;
      case 'SecurityError':
        toast.error('Security error accessing microphone. Please ensure you\'re using HTTPS.');
        break;
      case 'AbortError':
        toast.error('Recording was interrupted. Please try again.');
        break;
      default:
        toast.error(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    toast.error('Failed to start recording. Please check your microphone permissions.');
  }
};