import { corsHeaders } from '../config.ts';

export const createErrorResponse = (message: string, status = 500) => {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
};

export const validateRequestData = async (req: Request) => {
  let requestData;
  try {
    requestData = await req.json();
  } catch (e) {
    console.error('JSON parsing error:', e);
    throw new Error('Invalid JSON in request body');
  }

  if (!requestData?.audio || !requestData?.userId) {
    throw new Error('Audio data and userId are required');
  }

  return requestData;
};

export const processBase64Audio = (audioData: string) => {
  const base64Data = audioData.split(',')[1] || audioData;
  if (!base64Data) {
    throw new Error('Invalid audio data format');
  }

  try {
    const binaryString = atob(base64Data);
    const audioBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }
    console.log('Audio buffer created successfully, size:', audioBuffer.length);
    return audioBuffer;
  } catch (e) {
    console.error('Base64 decoding error:', e);
    throw new Error('Failed to decode audio data');
  }
};