import { corsHeaders } from '../config.ts';

export async function parseRequestBody(req: Request) {
  try {
    const body = await req.json();
    console.log('Request body parsed successfully');
    
    if (!body.audio) {
      console.error('No audio data provided in request');
      throw new Error('No audio data provided. Please record your expense.');
    }
    
    return body;
  } catch (error) {
    console.error('Failed to parse request body:', error);
    throw new Error('Invalid request format. Please try again.');
  }
}

export function handleCorsRequest() {
  console.log('Handling CORS preflight request');
  return new Response('ok', { headers: corsHeaders });
}

export function createErrorResponse(error: Error, status = 500) {
  console.error('Creating error response:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred.',
    }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      expense: data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}