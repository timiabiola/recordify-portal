import { toast } from 'sonner';
import { submitExpenseAudio } from './expenseService';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    console.log('Requesting microphone access...');
    
    // Specific constraints for better mobile compatibility
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    console.log('Microphone access granted, initializing MediaRecorder...');
    
    // Check for supported MIME types
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
      
    console.log('Using MIME type:', mimeType);
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });
    
    console.log('MediaRecorder initialized with settings:', {
      mimeType: mediaRecorder.mimeType,
      state: mediaRecorder.state
    });
    
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Received audio chunk of size:', event.data.size);
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      toast.error('Recording error occurred. Please try again.');
      setIsRecording(false);
      
      // Clean up the stream
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio chunks...');
      console.log('Total chunks collected:', audioChunks.length);
      
      try {
        if (audioChunks.length === 0) {
          throw new Error('No audio data recorded');
        }
        
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        await submitExpenseAudio(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process audio. Please try again.');
      }
    };

    // Start recording with smaller timeslice for more frequent chunks
    mediaRecorder.start(100);
    console.log('Started recording with state:', mediaRecorder.state);
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    
    // More specific error handling for mobile browsers
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          toast.error('Microphone access denied. Please grant permission and try again.');
          break;
        case 'NotFoundError':
          toast.error('No microphone found. Please ensure your device has a working microphone.');
          break;
        case 'NotReadableError':
          toast.error('Could not start microphone. Please check if another app is using it.');
          break;
        case 'SecurityError':
          toast.error('Recording requires a secure connection (HTTPS).');
          break;
        case 'AbortError':
          toast.error('Recording was aborted. Please try again.');
          break;
        default:
          toast.error('Failed to start recording. Please try again.');
      }
    } else {
      toast.error('Failed to start recording. Please try again.');
    }
    throw error;
  }
};