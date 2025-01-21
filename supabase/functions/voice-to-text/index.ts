import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log the incoming request content type
    console.log('Content-Type:', req.headers.get('content-type'));

    // Parse the request body
    const body = await req.text();
    console.log('Received body length:', body.length);

    // For debugging, log a sample of the received data
    console.log('Sample of received data:', body.substring(0, 100));

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('Parsed body structure:', JSON.stringify(Object.keys(parsedBody)));
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON format'
        }),
        {
          headers: corsHeaders,
          status: 400
        }
      );
    }

    // Validate required fields
    if (!parsedBody.audio || !parsedBody.userId) {
      console.error('Missing required fields:', JSON.stringify({
        hasAudio: !!parsedBody.audio,
        hasUserId: !!parsedBody.userId
      }));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: audio and userId are required'
        }),
        {
          headers: corsHeaders,
          status: 400
        }
      );
    }

    // Return a test response
    return new Response(
      JSON.stringify({
        success: true,
        expense: {
          amount: 10.00,
          description: "Test expense"
        }
      }),
      {
        headers: corsHeaders,
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in edge function:', JSON.stringify({
      message: error.message,
      stack: error.stack
    }));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.message
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});