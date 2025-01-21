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
    const requestData = await req.json()
    console.log('Processing request:', {
      hasAudio: !!requestData.audio,
      audioLength: requestData.audio?.length,
      userId: requestData.userId
    })

    if (!requestData.audio) {
      throw new Error('No audio data provided')
    }

    // Remove data URL prefix if present
    const base64Data = requestData.audio.replace(/^data:audio\/\w+;base64,/, '')
    
    // Create binary data from base64
    let audioBuffer: Uint8Array
    try {
      const binaryString = atob(base64Data)
      audioBuffer = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        audioBuffer[i] = binaryString.charCodeAt(i)
      }
      console.log('Audio buffer created, size:', audioBuffer.length)
    } catch (e) {
      console.error('Base64 decoding error:', e)
      throw new Error('Failed to decode audio data')
    }

    // Create form data for OpenAI API
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')

    console.log('Sending to Whisper API...')

    // Get transcription from Whisper API
    const transcriptionResponse = await openai.createTranscription(
      // @ts-ignore: FormData is not properly typed in OpenAI's types
      formData,
      'whisper-1'
    )

    const transcription = transcriptionResponse.data.text
    console.log('Transcription received:', transcription)

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

    const parsedText = parseResponse.data.choices[0].message?.content
    if (!parsedText) {
      throw new Error('Failed to parse expense data: No content received from GPT')
    }
    
    console.log('GPT response:', parsedText)
    
    let expenseData: ExpenseData
    try {
      expenseData = JSON.parse(parsedText)
      console.log('Parsed expense data:', expenseData)
    } catch (e) {
      console.error('JSON parsing error:', e)
      throw new Error('Failed to parse expense data: Invalid JSON')
    }

    // Save to database if userId is provided
    if (requestData.userId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      console.log('Saving expense to database...')

      // First, ensure the category exists or create it
      const { data: categoryData, error: categoryError } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('name', expenseData.category)
        .single()

      let categoryId: string
      if (categoryError) {
        // Category doesn't exist, create it
        const { data: newCategory, error: createCategoryError } = await supabaseClient
          .from('categories')
          .insert({ name: expenseData.category })
          .select()
          .single()

        if (createCategoryError) {
          console.error('Error creating category:', createCategoryError)
          throw createCategoryError
        }
        categoryId = newCategory.id
      } else {
        categoryId = categoryData.id
      }

      // Save the expense
      const { error: expenseError } = await supabaseClient
        .from('expenses')
        .insert({
          user_id: requestData.userId,
          category_id: categoryId,
          description: expenseData.description,
          amount: expenseData.amount,
          transcription: transcription
        })

      if (expenseError) {
        console.error('Error saving expense:', expenseError)
        throw expenseError
      }
      
      console.log('Expense saved successfully')
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
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})