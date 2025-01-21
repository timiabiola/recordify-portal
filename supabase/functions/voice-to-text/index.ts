import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { saveExpense } from './utils/expense.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Process audio data
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob and transcribe
    const blob = new Blob([bytes], { type: 'audio/webm' });
    console.log('Transcribing audio...');
    const text = await transcribeAudio(blob);
    console.log('Transcription:', text);

    // Extract expense details
    console.log('Extracting expense details...');
    const expenses = await extractExpenseDetails(text);
    console.log('Extracted expenses:', expenses);

    if (!expenses.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not understand the expense details. Please try again.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save expenses
    const savedExpenses = [];
    for (const expense of expenses) {
      try {
        const savedExpense = await saveExpense(supabaseAdmin, user.id, expense, text);
        savedExpenses.push(savedExpense);
      } catch (error) {
        console.error('Error saving expense:', error);
      }
    }

    if (savedExpenses.length === 0) {
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
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});