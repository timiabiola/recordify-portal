import { corsHeaders } from '../config.ts';

export const parseRequestBody = async (req: Request) => {
  try {
    const body = await req.json();
    console.log('Received request body:', {
      hasAudio: !!body?.audio,
      audioLength: body?.audio?.length
    });
    
    if (!body?.audio) {
      throw new Error('Audio data is required');
    }
    
    return body;
  } catch (error) {
    console.error('Error parsing request body:', error);
    throw new Error('Invalid request body: ' + error.message);
  }
};

export const handleCorsRequest = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const createErrorResponse = (error: Error, status = 500) => {
  const response = {
    success: false,
    error: error.message
  };
  
  console.error('Creating error response:', response);
  
  return new Response(
    JSON.stringify(response),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
};

export const createSuccessResponse = (data: any) => {
  const response = {
    success: true,
    ...data
  };
  
  console.log('Creating success response:', response);
  
  return new Response(
    JSON.stringify(response),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
};