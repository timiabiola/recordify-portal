import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processBase64Chunks, validateAudioFormat } from './utils/audio.ts';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { authenticateRequest } from './utils/auth.ts';
import { 
  parseRequestBody, 
  handleCorsRequest, 
  createErrorResponse, 
  createSuccessResponse 
} from './utils/request.ts';
import { saveExpense } from './utils/expense.ts';

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    // Authenticate request
    const { user, supabaseAdmin } = await authenticateRequest(
      req.headers.get('authorization')
    );

    // Parse request body
    const { audio } = await parseRequestBody(req);

    // Process and validate audio
    const { data: binaryAudio, mimeType, format } = processBase64Chunks(audio);
    
    // Validate format before creating blob
    if (!validateAudioFormat(`file.${format}`)) {
      return createErrorResponse(
        new Error(`Invalid audio format. Please ensure you are using a supported format (webm, mp3, wav).`),
        400
      );
    }
    
    const blob = new Blob([binaryAudio], { type: mimeType });

    // Transcribe audio
    const text = await transcribeAudio(blob);
    console.log('Audio transcription successful:', text);

    // Extract expense details
    console.log('Extracting expense details...');
    const expenses = await extractExpenseDetails(text);
    console.log('Extracted expenses:', expenses);

    // Save all expenses
    const savedExpenses = await Promise.all(
      expenses.map(expenseDetails => 
        saveExpense(supabaseAdmin, user.id, expenseDetails, text)
      )
    );
    console.log('Expenses saved successfully:', savedExpenses);

    return createSuccessResponse({ expenses: savedExpenses });

  } catch (error) {
    console.error('Edge function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    const status = error.message.includes('authenticated') ? 401 : 500;
    return createErrorResponse(error, status);
  }
});