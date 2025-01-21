import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processBase64Chunks, validateAudioFormat } from './utils/audio.ts';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { authenticateRequest } from './utils/auth.ts';
import { 
  parseRequestBody, 
  handleCorsRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from './utils/request.ts';
import { saveExpense } from './utils/expense.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Parse request body
    const { audio } = await req.json();
    if (!audio) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No audio detected. Please share the expenses you\'d like recorded and the amount!'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process and validate audio
    console.log('Processing audio data...');
    const { data: binaryAudio, mimeType, format } = processBase64Chunks(audio);
    
    // Check for empty audio (silence)
    if (binaryAudio.length < 1000) { // Threshold for detecting silence
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No audio detected. Please share the expenses you\'d like recorded and the amount!'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate format before creating blob
    if (!validateAudioFormat(`file.${format}`)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid audio format. Please ensure you are using a supported format (webm, mp3, wav).'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const blob = new Blob([binaryAudio], { type: mimeType });

    // Transcribe audio
    console.log('Transcribing audio...');
    const text = await transcribeAudio(blob);
    console.log('Audio transcription:', text);

    // Extract expense details
    console.log('Extracting expense details...');
    const expenses = await extractExpenseDetails(text);
    console.log('Extracted expenses:', expenses);

    return new Response(
      JSON.stringify({ success: true, expenses }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});