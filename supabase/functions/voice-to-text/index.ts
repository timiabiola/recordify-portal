import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processBase64Chunks, validateAudioFormat } from './utils/audio.ts';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { authenticateRequest } from './utils/auth.ts';
import { saveExpense } from './utils/expense.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      console.log('No audio data received');
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
    if (binaryAudio.length < 1000) {
      console.log('Audio data too short - likely silence');
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
      console.log('Invalid audio format:', format);
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authorization required'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transcribe audio
    console.log('Transcribing audio...');
    const text = await transcribeAudio(blob);
    console.log('Audio transcription:', text);

    // Extract expense details
    console.log('Extracting expense details...');
    const expenses = await extractExpenseDetails(text);
    console.log('Extracted expenses:', expenses);

    if (!Array.isArray(expenses)) {
      console.error('Invalid expenses format:', expenses);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to process expenses: Invalid format'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save each expense
    const savedExpenses = [];
    for (const expense of expenses) {
      try {
        console.log('Saving expense:', expense);
        const savedExpense = await saveExpense(supabaseAdmin, user.id, expense, text);
        console.log('Expense saved successfully:', savedExpense);
        savedExpenses.push(savedExpense);
      } catch (error) {
        console.error('Error saving expense:', error);
        // Continue with other expenses even if one fails
      }
    }

    if (savedExpenses.length === 0) {
      console.error('No expenses were saved successfully');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save any expenses'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('All expenses saved successfully:', savedExpenses);
    return new Response(
      JSON.stringify({
        success: true,
        expenses: savedExpenses
      }),
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