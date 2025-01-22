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
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Process audio data
    const transcriptionResult = await processAudioData(audio);
    
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

    // Validate user
    const user = await validateUser(req.headers);
    if (!user) {
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

    // Save expense
    const expense = await saveExpense(user.id, transcriptionResult.text);
    
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
}