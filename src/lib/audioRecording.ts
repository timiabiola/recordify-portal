import { initializeRecorder } from "./audio/recorder";
import { createRecordingHandlers } from "./audio/handlers";
import { handleRecordingError } from "./audio/errorHandling";
import { toast } from "sonner";

interface StartRecordingProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  isMobile?: boolean;
}

export const startRecording = async ({ isRecording, setIsRecording, isMobile }: StartRecordingProps) => {
  try {
    console.log('[AudioRecording] Starting recording process...', {
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        isMobile
      }
    });
    
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[AudioRecording] getUserMedia not supported');
      throw new Error('Your browser does not support audio recording');
    }

    console.log('[AudioRecording] Requesting microphone permissions...');
    
    // Request permissions with explicit error handling and mobile-specific constraints
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific settings
          ...(isMobile && {
            channelCount: 1,
            sampleRate: 44100,
            sampleSize: 16
          })
        }
      };

      console.log('[AudioRecording] Using audio constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
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

      const { recorder, stream: recorderStream } = await initializeRecorder(isMobile);
      console.log('[AudioRecording] Recorder initialized', {
        state: recorder.state,
        mimeType: recorder.mimeType,
        isMobile
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
      // Use smaller timeslices for mobile to prevent memory issues
      recorder.start(isMobile ? 500 : 1000);
      console.log('[AudioRecording] Recording started successfully', {
        timestamp: new Date().toISOString(),
        isMobile
      });
      setIsRecording(true);
      
      return recorder;
    } catch (error) {
      console.error('[AudioRecording] Error getting user media:', error);
      throw error;
    }
  } catch (error) {
    console.error('[AudioRecording] Error in startRecording:', error);
    handleRecordingError(error);
    setIsRecording(false);
    throw error;
  }
};