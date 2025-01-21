import { toast } from 'sonner';
import { submitExpenseAudio } from './expenseService';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    console.log('Microphone access granted, initializing MediaRecorder...');
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    
    console.log('MediaRecorder initialized with MIME type:', mediaRecorder.mimeType);
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
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio chunks...');
      console.log('Total chunks collected:', audioChunks.length);
      
      try {
        if (audioChunks.length === 0) {
          throw new Error('No audio data recorded');
        }
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Created audio blob of size:', audioBlob.size);
        console.log('Audio blob MIME type:', audioBlob.type);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        await submitExpenseAudio(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process audio. Please try again.');
      }
    };

    // Start recording with 10ms timeslice to ensure we get data
    mediaRecorder.start(10);
    console.log('Started recording');
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      toast.error('Microphone access denied. Please grant permission and try again.');
    } else if (error instanceof DOMException && error.name === 'NotFoundError') {
      toast.error('No microphone found. Please ensure your device has a working microphone.');
    } else {
      toast.error('Failed to start recording. Please try again.');
    }
    throw error;
  }
};