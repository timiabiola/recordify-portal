import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processBase64Chunks } from './utils/audio.ts';
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
      throw new Error('Not authenticated');
    }

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request format');
    }

    const { audio } = requestBody;
    if (!audio) {
      console.error('No audio data provided in request');
      throw new Error('Audio data is required');
    }

    console.log('Processing request for user:', user.id);

    // Process audio in chunks and transcribe
    try {
      const binaryAudio = processBase64Chunks(audio);
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      
      // Transcribe audio using Whisper API
      const text = await transcribeAudio(blob);
      console.log('Audio transcription successful:', text);

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
      
      // Determine if this is a known error type
      if (processingError.message.includes('OpenAI')) {
        throw new Error(`OpenAI API error: ${processingError.message}`);
      } else if (processingError.message.includes('parse')) {
        throw new Error(`Data processing error: ${processingError.message}`);
      } else {
        throw processingError; // Re-throw unknown errors
      }
    }

  } catch (error) {
    console.error('Edge function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Return a structured error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorType: error.name
      }),
      {
        headers: corsHeaders,
        status: error.message.includes('authenticated') ? 401 : 400
      }
    );
  }
});