import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processBase64Chunks, validateAudioFormat } from './utils/audio.ts';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { saveExpense } from './utils/database.ts';

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

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required. Please sign in.',
        }),
        { 
          status: 401,
          headers: corsHeaders 
        }
      );
    }

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication. Please sign in again.',
        }),
        { 
          status: 401,
          headers: corsHeaders 
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format. Please try again.',
        }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    const { audio } = requestBody;
    if (!audio) {
      console.error('No audio data provided in request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No audio data provided. Please record your expense.',
        }),
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    console.log('Processing request for user:', user.id);

    // Process audio and transcribe
    try {
      const binaryAudio = processBase64Chunks(audio);
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      
      // Validate audio format
      if (!validateAudioFormat('audio.webm')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid audio format. Please ensure you are using a supported format (webm, mp3, wav).',
          }), 
          { 
            status: 400,
            headers: corsHeaders 
          }
        );
      }
      
      // Transcribe audio using Whisper API
      let text;
      try {
        text = await transcribeAudio(blob);
        console.log('Audio transcription successful:', text);
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to transcribe audio. Please speak clearly and try again.',
          }),
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      }

      // Extract expense details from transcribed text
      console.log('Extracting expense details...');
      const expenseDetails = await extractExpenseDetails(text);
      console.log('Extracted expense details:', expenseDetails);

      // Save the expense to the database
      const expense = await saveExpense(supabaseAdmin, user.id, expenseDetails, text);
      console.log('Expense saved successfully:', expense);

      return new Response(
        JSON.stringify({
          success: true,
          expense: expense
        }),
        { headers: corsHeaders }
      );

    } catch (processingError) {
      console.error('Error processing audio or saving expense:', {
        error: processingError,
        message: processingError.message,
        stack: processingError.stack
      });
      
      // Determine if this is a known error type and provide specific feedback
      if (processingError.message.includes('OpenAI')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to process your expense. Please try again.',
          }),
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      } else if (processingError.message.includes('parse')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Could not understand the expense details. Please speak clearly and try again.',
          }),
          { 
            status: 400,
            headers: corsHeaders 
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'An unexpected error occurred. Please try again.',
          }),
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      }
    }

  } catch (error) {
    console.error('Edge function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Return a user-friendly error message
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Something went wrong. Please try again later.',
        details: error.message
      }),
      {
        headers: corsHeaders,
        status: error.message.includes('authenticated') ? 401 : 500
      }
    );
  }
});