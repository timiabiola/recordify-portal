import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  console.log('Transcribing audio...');
  
  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
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
  console.log('Extracting expense details from text:', text);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts expense information from text.
                     For each expense mentioned, identify:
                     1. The amount spent (as a number)
                     2. A brief description
                     3. The category (must be one of: food, entertainment, transport, shopping, utilities, other)
                     
                     Return a JSON array where each expense has these exact fields:
                     - amount (number)
                     - description (string)
                     - category (string, matching one of the categories above)
                     
                     Example response:
                     [{"amount": 25.50, "description": "lunch", "category": "food"}]
                     
                     Return ONLY the JSON array, no additional text or formatting.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to extract expense details');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    try {
      const rawExpenses = JSON.parse(data.choices[0].message.content);
      console.log('Raw parsed expenses:', rawExpenses);

      if (!Array.isArray(rawExpenses)) {
        throw new Error('Expected an array of expenses');
      }

      const validCategories = ['food', 'entertainment', 'transport', 'shopping', 'utilities', 'other'];
      
      const validatedExpenses = rawExpenses.map(expense => {
        if (!expense.amount || typeof expense.amount !== 'number') {
          throw new Error('Invalid amount in expense');
        }
        if (!expense.description || typeof expense.description !== 'string') {
          throw new Error('Invalid description in expense');
        }
        if (!expense.category || !validCategories.includes(expense.category)) {
          expense.category = 'other';
        }
        return {
          amount: expense.amount,
          description: expense.description,
          category: expense.category
        };
      });

      console.log('Validated expenses:', validatedExpenses);
      return validatedExpenses;
    } catch (parseError) {
      console.error('Failed to parse or validate expenses:', parseError);
      throw new Error('Failed to parse expense details: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}