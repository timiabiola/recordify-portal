import OpenAI from 'https://esm.sh/openai@4.20.1'

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Starting audio transcription...');
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Force English to improve accuracy
    formData.append('prompt', 'The audio contains an expense amount and category, like "$175 on groceries" or "$50 for gas".'); // Context prompt
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Transcription error:', error);
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const result = await response.json();
    console.log('Transcription result:', result);
    return result.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Extracting expense details from:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a literal expense parser. Extract EXACTLY what was spoken:
1. Use the EXACT amount mentioned
2. Use the EXACT description spoken
3. Map to the closest category

Return a JSON array with exactly one expense object containing:
{
  "amount": exact number mentioned,
  "description": exact words spoken,
  "category": one of (food, transportation, entertainment, shopping, bills, other)
}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0 // Set to 0 for most deterministic, literal response
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI');
      return [];
    }

    console.log('OpenAI raw response:', response);
    
    try {
      // Remove any potential whitespace and validate JSON structure
      const cleanedResponse = response.trim();
      if (!cleanedResponse.startsWith('[') || !cleanedResponse.endsWith(']')) {
        console.error('Invalid JSON array format:', cleanedResponse);
        return [];
      }

      const parsed = JSON.parse(cleanedResponse);
      if (!Array.isArray(parsed)) {
        console.error('Parsed response is not an array:', parsed);
        return [];
      }

      // Validate each expense object
      const validExpenses = parsed.filter(expense => {
        const isValid = 
          typeof expense === 'object' &&
          expense !== null &&
          typeof expense.amount === 'number' && 
          typeof expense.description === 'string' && 
          typeof expense.category === 'string' &&
          ['food', 'transportation', 'entertainment', 'shopping', 'bills', 'other'].includes(expense.category.toLowerCase());
        
        if (!isValid) {
          console.error('Invalid expense format:', expense);
        }
        return isValid;
      });

      console.log('Valid expenses:', validExpenses);
      return validExpenses;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}