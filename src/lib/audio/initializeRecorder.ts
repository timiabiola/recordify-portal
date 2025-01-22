import { toast } from "sonner";
import { AudioConstraints } from "./types";

export const getAudioConstraints = (isMobile: boolean): AudioConstraints => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(isMobile && {
      channelCount: 1,
      sampleRate: 44100,
      sampleSize: 16
    })
  }
});

export const getMimeType = (): string => {
  const mimeTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
  
  if (!supportedMimeType) {
    throw new Error('No supported audio MIME type found');
  }

  return supportedMimeType;
};

export const initializeMediaStream = async (constraints: AudioConstraints): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia is not supported in this browser');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const audioTrack = stream.getAudioTracks()[0];
    
    if (!audioTrack?.enabled) {
      throw new Error('No active audio track available');
    }

    console.log('[Audio Recorder] Stream initialized', {
      settings: audioTrack.getSettings(),
      constraints: audioTrack.getConstraints()
    });

    return stream;
  } catch (error) {
    console.error('[Audio Recorder] Error initializing stream:', error);
    throw error;
  }
};

export const createMediaRecorder = (stream: MediaStream, isMobile: boolean): MediaRecorder => {
  try {
    const mimeType = getMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: isMobile ? 64000 : 128000
    });

    console.log('[Audio Recorder] MediaRecorder created', {
      mimeType,
      state: recorder.state
    });

    return recorder;
  } catch (error) {
    console.error('[Audio Recorder] Error creating MediaRecorder:', error);
    throw error;
  }
};