import { toast } from 'sonner';
import { submitExpenseAudio } from './expenseService';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    console.log('Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Microphone access granted');
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm' // Explicitly set the MIME type to webm
    });
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log('Received audio chunk of size:', event.data.size);
      console.log('Audio chunk MIME type:', event.data.type);
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio chunks...');
      console.log('Total chunks collected:', audioChunks.length);
      
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Created audio blob of size:', audioBlob.size);
        console.log('Audio blob MIME type:', audioBlob.type);
        await submitExpenseAudio(audioBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process audio. Please try again.');
      }
    };

    mediaRecorder.start();
    console.log('Started recording');
    setIsRecording(true);
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};