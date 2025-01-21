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
    const requestData = await validateRequestData(req);
    
    console.log('Processing request:', {
      hasAudio: !!requestData?.audio,
      userId: requestData?.userId,
      audioLength: requestData?.audio?.length
    });

    const audioBuffer = processBase64Audio(requestData.audio);
    const transcription = await transcribeAudio(openai, audioBuffer);
    console.log('Transcription received:', transcription);

    const expenseData = await parseExpenseWithGPT(openai, transcription);
    console.log('Parsed expense data:', expenseData);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Saving expense to database...');
    await saveExpenseToDatabase(supabaseClient, requestData.userId, expenseData, transcription);
    console.log('Expense saved successfully');

    return new Response(
      JSON.stringify({
        text: transcription,
        expense: expenseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return createErrorResponse(err?.message || 'Internal server error');
  }
});