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
          error: 'No audio detected. Please speak clearly and try again!'
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

    // Process audio data
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob and transcribe
    const blob = new Blob([bytes], { type: 'audio/webm;codecs=opus' });
    console.log('Processing audio blob:', blob.size, 'bytes');
    
    // Send to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcriptionResult = await response.json();
    console.log('Transcription result:', transcriptionResult);

    if (!transcriptionResult.text || transcriptionResult.text.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No speech detected. Please speak clearly and try again!'
        }),
        { 
          status: 400,
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

    // Extract expense details
    console.log('Extracting expense details from:', transcriptionResult.text);
    const expenses = await extractExpenseDetails(transcriptionResult.text);
    console.log('Extracted expenses:', expenses);

    if (!expenses || expenses.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please clearly state the amount and category of your expense. For example: "Spent 50 dollars on groceries" or "15.99 for Netflix subscription".'
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
        const savedExpense = await saveExpense(supabaseAdmin, user.id, expense, transcriptionResult.text);
        savedExpenses.push(savedExpense);
      } catch (error) {
        console.error('Error saving expense:', error);
      }
    }

    if (savedExpenses.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save expenses'
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
        error: 'Please clearly state both the amount and category of your expense. For example: "Spent 20 dollars on lunch" or "Monthly gym membership 50 dollars".'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});