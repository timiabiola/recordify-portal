import OpenAI from 'https://esm.sh/openai@4.20.1'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

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
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text. 
          Extract the amount and description, and categorize the expense into one of these categories: 
          Food, Transportation, Entertainment, Shopping, Bills, Other.
          
          Format your response as a JSON string with an 'expenses' array containing objects with:
          - amount (number)
          - description (string)
          - category (string, must be one of the above categories)
          
          If multiple expenses are mentioned, return multiple objects.
          If no valid expense is found, return an empty array.
          
          Example response:
          {"expenses": [{"amount": 25.50, "description": "lunch at cafe", "category": "Food"}]}`
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

    console.log('OpenAI response:', response);
    
    try {
      const parsed = JSON.parse(response);
      if (!Array.isArray(parsed.expenses)) {
        console.error('Invalid response format:', parsed);
        return [];
      }

      // Validate each expense
      const validExpenses = parsed.expenses.filter(expense => {
        const isValid = 
          typeof expense.amount === 'number' && 
          typeof expense.description === 'string' && 
          typeof expense.category === 'string' &&
          ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'].includes(expense.category);
        
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
    return [];
  }
}