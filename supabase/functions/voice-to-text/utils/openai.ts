import OpenAI from 'https://esm.sh/openai@4.20.1'

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Starting audio transcription...');
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    
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
          content: `You are a helpful assistant that extracts expense information from text.
You must return ONLY valid JSON with no additional text or formatting.
The response should be an array with a single object containing:
- amount (number)
- description (string)
- category (string, one of: food, transportation, entertainment, shopping, bills, other)

Example valid response:
[{"amount": 25.50, "description": "lunch at cafe", "category": "food"}]`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI');
      return [];
    }

    console.log('OpenAI raw response:', response);
    
    try {
      const parsed = JSON.parse(response.trim());
      if (!Array.isArray(parsed)) {
        console.error('Invalid response format - not an array:', parsed);
        return [];
      }

      // Validate each expense
      const validExpenses = parsed.filter(expense => {
        const isValid = 
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