import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createOpenAIClient, transcribeAudio, parseExpenseWithGPT } from './utils/openai.ts';
import { createErrorResponse, validateRequestData, processBase64Audio } from './utils/errorHandling.ts';
import { saveExpenseToDatabase } from './utils/database.ts';

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
    // Log request details
    console.log('Request received:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      url: req.url
    });

    // Parse and validate request body
    const requestText = await req.text();
    console.log('Request body length:', requestText.length);
    console.log('Request body preview:', requestText.substring(0, 200));

    let parsedBody;
    try {
      parsedBody = JSON.parse(requestText);
      console.log('Parsed request body keys:', Object.keys(parsedBody));
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON format: ' + parseError.message
        }),
        {
          headers: corsHeaders,
          status: 400
        }
      );
    }

    // Validate required fields
    if (!parsedBody.audio || !parsedBody.userId) {
      const missingFields = [];
      if (!parsedBody.audio) missingFields.push('audio');
      if (!parsedBody.userId) missingFields.push('userId');
      
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        }),
        {
          headers: corsHeaders,
          status: 400
        }
      );
    }

    // For now, return a test response
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
      {
        headers: corsHeaders,
        status: 200
      }
    );

  } catch (error) {
    console.error('Edge function error:', {
      message: error.message,
      stack: error.stack
    });
    
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