import { corsHeaders } from "../config.ts";
import { processAudioData } from "./audioProcessor.ts";
import { validateUser } from "./authHandler.ts";
import { saveExpense } from "./expenseHandler.ts";

export async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    console.log('[Voice-to-Text] Processing request with audio data length:', audio?.length);

    if (!audio) {
      console.error('[Voice-to-Text] No audio data provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please clearly state both the amount and category of your expense. For example: "Spent 20 dollars on lunch" or "Monthly gym membership 50 dollars".'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Voice-to-Text] Validating user...');
    const user = await validateUser(req.headers);
    if (!user) {
      console.error('[Voice-to-Text] User validation failed');
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
    console.log('[Voice-to-Text] User validated successfully:', user.id);

    console.log('[Voice-to-Text] Processing audio data...');
    const transcriptionResult = await processAudioData(audio);
    
    if (!transcriptionResult?.text || transcriptionResult.text.trim() === '') {
      console.error('[Voice-to-Text] No transcription text generated');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please clearly state both the amount and category of your expense. For example: "Spent 20 dollars on lunch" or "Monthly gym membership 50 dollars".'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Voice-to-Text] Transcription successful:', transcriptionResult.text);

    try {
      console.log('[Voice-to-Text] Saving expense...');
      const expense = await saveExpense(user.id, transcriptionResult.text);
      console.log('[Voice-to-Text] Expense saved successfully:', expense);
      
      return new Response(
        JSON.stringify({
          success: true,
          expense: expense
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('[Voice-to-Text] Error saving expense:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please clearly state both the amount and category of your expense. For example: "Spent 20 dollars on lunch" or "Monthly gym membership 50 dollars".'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('[Voice-to-Text] Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Please clearly state both the amount and category of your expense. For example: "Spent 20 dollars on lunch" or "Monthly gym membership 50 dollars".'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}