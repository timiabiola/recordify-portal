import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { createErrorResponse, validateRequestData, processBase64Audio } from './utils/errorHandling.ts';
import { createOpenAIClient, transcribeAudio, parseExpenseWithGPT } from './utils/openai.ts';
import { saveExpenseToDatabase } from './utils/database.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openai = createOpenAIClient(Deno.env.get('OPENAI_API_KEY'));
    
    // Log the incoming request
    console.log('Processing new request...');
    
    const requestData = await validateRequestData(req);
    console.log('Request validation passed:', {
      hasAudio: !!requestData?.audio,
      userId: requestData?.userId,
      audioLength: requestData?.audio?.length
    });

    const audioBuffer = await processBase64Audio(requestData.audio);
    console.log('Audio processing completed, buffer size:', audioBuffer.length);

    const transcription = await transcribeAudio(openai, audioBuffer);
    console.log('Transcription received:', JSON.stringify({ text: transcription }));

    const expenseData = await parseExpenseWithGPT(openai, transcription);
    console.log('Parsed expense data:', JSON.stringify(expenseData));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Saving expense to database...');
    await saveExpenseToDatabase(supabaseClient, requestData.userId, expenseData, transcription);
    console.log('Expense saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        text: transcription,
        expense: expenseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      },
    );
  } catch (err) {
    console.error('Edge function error:', JSON.stringify({
      message: err?.message,
      stack: err?.stack,
      name: err?.name
    }));
    
    return createErrorResponse(
      err?.message || 'Internal server error',
      err?.status || 500
    );
  }
});