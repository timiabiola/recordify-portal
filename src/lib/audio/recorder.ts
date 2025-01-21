import { AUDIO_CONSTRAINTS } from './config';
import { handleAudioError } from './errorHandling';
import type { AudioRecorderState } from './types';

export const initializeRecorder = async () => {
  console.log('Requesting microphone access...');
  
  if (!window.MediaRecorder) {
    throw new Error('MediaRecorder is not supported in this browser');
  }

  const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
  console.log('Microphone access granted, stream active:', stream.active);
  
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack || !audioTrack.enabled) {
    throw new Error('No active audio track available');
  }
  
  return stream;
};

export const createRecorder = (
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
  onStop: () => void,
  onError: (event: Event) => void,
  state: AudioRecorderState
) => {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/wav',
    audioBitsPerSecond: AUDIO_CONSTRAINTS.audio.audioBitsPerSecond,
  });

  mediaRecorder.ondataavailable = onDataAvailable;
  mediaRecorder.onstop = onStop;
  mediaRecorder.onerror = onError;

  return mediaRecorder;
};