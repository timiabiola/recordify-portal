import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { audio, userId } = await req.json();
    
    if (!audio || !userId) {
      console.error('Missing required fields:', { hasAudio: !!audio, hasUserId: !!userId });
      throw new Error('Missing required fields');
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Process base64 audio
    const base64Data = audio.split(',')[1] || audio;
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Create form data for OpenAI
    const formData = new FormData();
    const blob = new Blob([bytes], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending request to OpenAI Whisper API');
    
    // Get transcription from OpenAI
    const transcriptionResponse = await openai.createTranscription(
      formData,
      'whisper-1'
    );

    if (!transcriptionResponse.data?.text) {
      throw new Error('No transcription received from OpenAI');
    }

    const transcription = transcriptionResponse.data.text;
    console.log('Received transcription:', transcription);

    // Parse expense details with GPT
    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts expense information from text. Extract the amount and description. Return ONLY a JSON object with 'amount' (number) and 'description' (string) fields."
        },
        {
          role: "user",
          content: transcription
        }
      ]
    });

    if (!gptResponse.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid GPT response');
    }

    const parsedText = gptResponse.data.choices[0].message.content.trim();
    console.log('GPT parsed response:', parsedText);

    let expenseData;
    try {
      expenseData = JSON.parse(parsedText);
      if (!expenseData.amount || !expenseData.description) {
        throw new Error('Missing required expense fields');
      }
    } catch (e) {
      console.error('Failed to parse expense data:', e);
      throw new Error('Invalid expense data format');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get default category
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('id')
      .limit(1);

    if (!categories?.length) {
      throw new Error('No categories found');
    }

    // Save expense to database
    const { data: expense, error: insertError } = await supabaseClient
      .from('expenses')
      .insert({
        user_id: userId,
        category_id: categories[0].id,
        amount: expenseData.amount,
        description: expenseData.description,
        transcription: transcription
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw new Error('Failed to save expense');
    }

    return new Response(
      JSON.stringify({
        success: true,
        expense: expense
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});