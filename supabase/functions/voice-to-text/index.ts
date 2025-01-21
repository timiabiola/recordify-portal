import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpenseData {
  amount: number;
  description: string;
  category: string;
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  // Remove data URL prefix if present
  const cleanBase64 = base64String.split(',')[1] || base64String;
  
  while (position < cleanBase64.length) {
    const chunk = cleanBase64.slice(position, position + chunkSize);
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API Key')
    }

    const configuration = new Configuration({ apiKey: OPENAI_API_KEY })
    const openai = new OpenAIApi(configuration)

    // Get request body and validate
    const { audio, userId } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Processing audio data...');

    // Process audio data in chunks
    const audioBytes = processBase64Chunks(audio);
    
    // Create blob and form data
    const audioBlob = new Blob([audioBytes], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending to Whisper API...');

    // Get transcription from Whisper API
    const transcriptionResponse = await openai.createTranscription(
      // @ts-ignore: FormData is not properly typed in OpenAI's types
      formData,
      'whisper-1'
    )

    const transcription = transcriptionResponse.data.text
    console.log('Transcription received:', transcription);

    // Use GPT to parse the transcription
    const parseResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text. 
          Extract the amount (as a number), description (as text), and category (must be one of: food, transport, entertainment, shopping, utilities, other).
          If a category isn't explicitly mentioned, infer it from the description.
          Return only a JSON object with these three fields.`
        },
        {
          role: "user",
          content: transcription
        }
      ]
    })

    const parsedText = parseResponse.data.choices[0].message?.content || ''
    console.log('Parsed expense data:', parsedText);
    
    let expenseData: ExpenseData;
    try {
      expenseData = JSON.parse(parsedText)
    } catch (e) {
      console.error('Failed to parse expense data:', e);
      throw new Error('Failed to parse expense data')
    }

    // Save to database if userId is provided
    if (userId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      console.log('Saving expense to database...');

      // First, ensure the category exists or create it
      const { data: categoryData, error: categoryError } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('name', expenseData.category)
        .single()

      if (categoryError) {
        // Category doesn't exist, create it
        const { data: newCategory, error: createCategoryError } = await supabaseClient
          .from('categories')
          .insert({ name: expenseData.category })
          .select()
          .single()

        if (createCategoryError) throw createCategoryError
        expenseData.category = newCategory.id
      } else {
        expenseData.category = categoryData.id
      }

      // Save the expense
      const { error: expenseError } = await supabaseClient
        .from('expenses')
        .insert({
          user_id: userId,
          category_id: expenseData.category,
          description: expenseData.description,
          amount: expenseData.amount,
          transcription: transcription
        })

      if (expenseError) {
        console.error('Error saving expense:', expenseError);
        throw expenseError;
      }
    }

    return new Response(
      JSON.stringify({
        text: transcription,
        expense: expenseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})