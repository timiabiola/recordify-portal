import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const requestBody = await req.text();
    console.log('Request body length:', requestBody.length);
    console.log('Request body preview:', requestBody.substring(0, 100) + '...');

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Request body parsed successfully. Keys:', Object.keys(parsedBody));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format: ' + parseError.message }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Validate required fields
    if (!parsedBody.audio || !parsedBody.userId) {
      const missingFields = [];
      if (!parsedBody.audio) missingFields.push('audio');
      if (!parsedBody.userId) missingFields.push('userId');
      
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Process the audio data
    console.log('Processing audio data...');
    console.log('Audio data length:', parsedBody.audio.length);
    console.log('User ID:', parsedBody.userId);
    
    // For testing, return a mock response
    console.log('Returning test response');
    return new Response(
      JSON.stringify({
        success: true,
        expense: {
          amount: 10.00,
          description: "Test expense",
          category: "food"
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error: ' + error.message,
        details: error.stack
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});