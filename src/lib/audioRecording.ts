import { toast } from 'sonner';
import { submitExpenseAudio } from './expenseService';

export const startRecording = async (setIsRecording: (isRecording: boolean) => void) => {
  try {
    console.log('Requesting microphone access...');
    
    // Check if MediaRecorder is available
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser');
    }
    
    // Get supported MIME types
    const supportedMimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];

    // Find the first supported MIME type
    const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    
    if (!mimeType) {
      console.error('No supported MIME types found');
      throw new Error('No supported audio format found in this browser');
    }
    
    console.log('Using MIME type:', mimeType);
    
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
    
    console.log('Microphone access granted, stream active:', stream.active);
    console.log('Audio tracks:', stream.getAudioTracks().length);
    
    // Verify we have an active audio track
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      throw new Error('No active audio track available');
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });
    
    console.log('MediaRecorder initialized:', {
      state: mediaRecorder.state,
      mimeType: mediaRecorder.mimeType,
      audioBitsPerSecond: mediaRecorder.audioBitsPerSecond
    });
    
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Received audio chunk:', {
          size: event.data.size,
          type: event.data.type
        });
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      toast.error('Recording error occurred. Please try again.');
      setIsRecording(false);
      
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio chunks...');
      
      try {
        if (audioChunks.length === 0) {
          throw new Error('No audio data recorded');
        }
        
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log('Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        await submitExpenseAudio(audioBlob);
        
        // Clear the chunks array
        audioChunks.length = 0;
      } catch (error) {
        console.error('Error processing audio:', error);
        toast.error('Failed to process audio. Please try again.');
      } finally {
        // Always clean up the stream
        stream.getTracks().forEach(track => track.stop());
      }
    };

    // Start recording with smaller timeslice for more frequent chunks
    mediaRecorder.start(100);
    console.log('Started recording with state:', mediaRecorder.state);
    setIsRecording(true);
    
    return mediaRecorder;
  } catch (error) {
    console.error('Error starting recording:', error);
    
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
          toast.error(`Failed to start recording: ${error.message}`);
      }
    } else {
      toast.error('Failed to start recording. Please try again.');
    }
    throw error;
  }
};