import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractExpenseDetails } from "./utils/expenseExtraction.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Clean and validate the base64 audio data
    const base64Data = audio.split(',')[1] || audio;
    console.log('Processing base64 audio data of length:', base64Data.length);

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create audio blob with proper MIME type
    const audioBlob = new Blob([bytes], { type: 'audio/webm;codecs=opus' });
    console.log('Created audio blob of size:', audioBlob.size, 'bytes');

    // Prepare form data for OpenAI
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    console.log('Sending request to OpenAI Whisper API...');
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

    // Extract user from auth header
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

    // Extract expense details using GPT
    console.log('Extracting expense details from:', transcriptionResult.text);
    const expenseDetails = await extractExpenseDetails(transcriptionResult.text);
    console.log('Extracted expense details:', expenseDetails);

    if (!expenseDetails) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not understand the expense details. Please try again with a clearer description including both amount and category.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get category id
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', expenseDetails.category)
      .single();

    if (categoryError || !categoryData) {
      console.error('Error finding category:', categoryError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid expense category. Please try again.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: user.id,
        category_id: categoryData.id,
        amount: expenseDetails.amount,
        description: expenseDetails.description,
        transcription: transcriptionResult.text
      })
      .select('*, categories(name)')
      .single();

    if (expenseError) {
      console.error('Error saving expense:', expenseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save expense. Please try again.'
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
        expense: expense
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