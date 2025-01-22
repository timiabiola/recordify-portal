import { initializeRecorder } from "./audio/recorder";
import { createRecordingHandlers } from "./audio/handlers";
import { handleRecordingError } from "./audio/errorHandling";
import { toast } from "sonner";

interface StartRecordingProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const startRecording = async ({ isRecording, setIsRecording }: StartRecordingProps) => {
  try {
    console.log('[AudioRecording] Starting recording process...', {
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia
      }
    });
    
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[AudioRecording] getUserMedia not supported');
      throw new Error('Your browser does not support audio recording');
    }

    console.log('[AudioRecording] Requesting microphone permissions...');
    
    // Request permissions with explicit error handling
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('[AudioRecording] Microphone permissions granted', {
        tracks: stream.getAudioTracks().map(track => ({
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          constraints: track.getConstraints(),
          settings: track.getSettings()
        }))
      });
    } catch (error) {
      console.error('[AudioRecording] Error getting user media:', error);
      throw error;
    }
    
    const { recorder, stream: recorderStream } = await initializeRecorder();
    console.log('[AudioRecording] Recorder initialized', {
      state: recorder.state,
      mimeType: recorder.mimeType
    });
    
    const handlers = createRecordingHandlers();
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      console.log('[AudioRecording] Data chunk available:', { 
        size: e.data.size,
        type: e.data.type,
        timestamp: new Date().toISOString()
      });
      handlers.handleDataAvailable(chunks, e);
    };
    
    recorder.onstop = () => {
      console.log('[AudioRecording] Recording stopped, processing chunks...', {
        totalChunks: chunks.length,
        timestamp: new Date().toISOString()
      });
      recorderStream.getTracks().forEach(track => track.stop());
      handlers.handleRecordingStop(chunks, recorder.mimeType);
    };

    recorder.onerror = (event) => {
      console.error('[AudioRecording] Recorder error:', event);
      toast.error('Recording error occurred. Please try again.');
    };

    console.log('[AudioRecording] Starting recorder with mimeType:', recorder.mimeType);
    recorder.start(1000);
    console.log('[AudioRecording] Recording started successfully', {
      timestamp: new Date().toISOString()
    });
    setIsRecording(true);
    
    return recorder;
  } catch (error) {
    console.error('[AudioRecording] Error in startRecording:', error);
    handleRecordingError(error);
    setIsRecording(false);
    throw error;
  }
};