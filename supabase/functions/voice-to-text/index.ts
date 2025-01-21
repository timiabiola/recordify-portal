import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

async function extractExpenseDetails(text: string) {
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });

  const prompt = `Extract expense information from this text. Return a JSON object with amount (number), description (string), and category (string). Categories should be one of: food, entertainment, transport, shopping, utilities, other. Text: "${text}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that extracts expense information from text and returns it in a consistent format."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
  });

  try {
    const response = completion.choices[0].message.content;
    console.log("OpenAI response:", response);
    return JSON.parse(response);
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    throw new Error("Failed to parse expense details");
  }
}

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

    const { audio } = await req.json();
    console.log('Processing request for user:', user.id);
    
    if (!audio) {
      throw new Error('Audio data is required');
    }

    // Process audio in chunks and transcribe
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    // Transcribe audio using Whisper API
    console.log('Sending audio to Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      throw new Error(`Whisper API error: ${await whisperResponse.text()}`);
    }

    const { text } = await whisperResponse.json();
    console.log('Transcribed text:', text);

    // Extract expense details from transcribed text
    console.log('Extracting expense details...');
    const expenseDetails = await extractExpenseDetails(text);
    console.log('Extracted expense details:', expenseDetails);

    // First, ensure the category exists or create it
    console.log('Looking up category:', expenseDetails.category);
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', expenseDetails.category)
      .single();

    let categoryId;
    if (categoryError) {
      console.log('Category not found, creating new category');
      const { data: newCategory, error: createCategoryError } = await supabaseAdmin
        .from('categories')
        .insert({ name: expenseDetails.category })
        .select()
        .single();

      if (createCategoryError) {
        console.error('Error creating category:', createCategoryError);
        throw new Error('Failed to create category');
      }
      categoryId = newCategory.id;
    } else {
      categoryId = categoryData.id;
    }

    console.log('Using category ID:', categoryId);

    // Create the expense record using the authenticated user's ID
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        description: expenseDetails.description,
        amount: expenseDetails.amount,
        transcription: text
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      throw expenseError;
    }

    console.log('Expense created successfully:', expense);

    return new Response(
      JSON.stringify({
        success: true,
        expense: expense
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: corsHeaders,
        status: 400
      }
    );
  }
});
