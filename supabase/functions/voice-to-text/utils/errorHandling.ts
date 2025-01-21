import { corsHeaders } from '../config.ts';

export const createErrorResponse = (message: string, status = 500) => {
  const errorResponse = {
    success: false,
    error: message
  };
  
  console.error('Creating error response:', JSON.stringify(errorResponse));
  
  return new Response(
    JSON.stringify(errorResponse),
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
    console.log('Received request data:', JSON.stringify({
      hasAudio: !!requestData?.audio,
      hasUserId: !!requestData?.userId
    }));
  } catch (e) {
    console.error('JSON parsing error:', e);
    throw new Error('Invalid JSON in request body');
  }

  if (!requestData?.audio) {
    throw new Error('Audio data is required');
  }

  if (!requestData?.userId) {
    throw new Error('User ID is required');
  }

  return requestData;
};

export const processBase64Audio = async (audioData: string) => {
  try {
    // Remove data URL prefix if present
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
    
    if (!base64Data) {
      throw new Error('Invalid audio data format');
    }

    console.log('Processing audio data of length:', base64Data.length);

    // Convert base64 to binary in chunks to handle large files
    const binaryString = atob(base64Data);
    const audioBuffer = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }
    
    console.log('Audio buffer created successfully, size:', audioBuffer.length);
    return audioBuffer;
  } catch (e) {
    console.error('Base64 processing error:', JSON.stringify({
      message: e?.message,
      name: e?.name
    }));
    throw new Error('Failed to process audio data: ' + e.message);
  }
};