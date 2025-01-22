import { toast } from "sonner";

export const handleRecordingError = (error: unknown) => {
  console.error('Recording error:', error);

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        toast({
          variant: "destructive",
          title: "Microphone access denied",
          description: 'Please allow microphone access in your browser settings.'
        });
        break;
      case 'NotFoundError':
        toast({
          variant: "destructive",
          title: "No microphone found",
          description: 'Please ensure your device has a working microphone.'
        });
        break;
      default:
        toast({
          variant: "destructive",
          title: "Recording failed",
          description: `${error.name}: ${error.message}`
        });
    }
  } else {
    toast({
      variant: "destructive",
      title: "Recording failed",
      description: 'Please check your microphone permissions.'
    });
  }
};