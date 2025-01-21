import { toast } from 'sonner';
import { submitExpenseAudio } from './expenseService';
import { initializeRecorder, createRecorder } from './audio/recorder';
import { handleAudioError } from './audio/errorHandling';
import type { AudioRecorderState } from './audio/types';

export const startRecording = async (state: AudioRecorderState) => {
  try {
    if (state.isRecording) {
      console.warn('Recording already in progress');
      return null;
    }

    const stream = await initializeRecorder();
    const audioChunks: Blob[] = [];

    const mediaRecorder = createRecorder(
      stream,
      (event) => {
        if (event.data.size > 0) {
          console.log('Received audio chunk:', {
            size: event.data.size,
            type: event.data.type
          });
          audioChunks.push(event.data);
        }
      },
      async () => {
        try {
          if (audioChunks.length === 0) {
            throw new Error('No audio data recorded');
          }
          
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          console.log('Created audio blob:', {
            size: audioBlob.size,
            type: audioBlob.type
          });
          
          await submitExpenseAudio(audioBlob);
          audioChunks.length = 0;
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error('Failed to process audio. Please try again.');
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      },
      (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error occurred. Please try again.');
        state.setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      },
      state
    );

    mediaRecorder.start(100);
    console.log('Started recording with state:', mediaRecorder.state);
    state.setIsRecording(true);
    
    return mediaRecorder;
  } catch (error) {
    handleAudioError(error);
    return null;
  }
};