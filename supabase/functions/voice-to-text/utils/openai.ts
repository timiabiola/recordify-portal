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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

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
                     1. A one-word summary of what was purchased
                     2. The amount spent
                     3. The category (must be one of: essentials, leisure, recurring_payments)
                     
                     Rules for categorization:
                     - essentials: groceries, utilities, basic needs
                     - recurring_payments: bills, subscriptions, regular payments
                     - leisure: entertainment, dining out, non-essential purchases
                     
                     Return an array of expenses, each with these exact fields:
                     - amount (number)
                     - description (one-word summary)
                     - category (one of the three categories)`
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

    const expenses = JSON.parse(data.choices[0].message.content);
    console.log('Parsed expenses:', expenses);

    // Ensure we have an array of expenses
    const expensesArray = Array.isArray(expenses) ? expenses : [expenses];

    // Process each expense
    return expensesArray.map(expense => {
      const validCategories = ['essentials', 'leisure', 'recurring_payments'];
      const category = expense.category?.toLowerCase() || 'essentials';
      
      // Ensure description is one word and capitalized
      const description = expense.description
        .split(' ')[0] // Take only the first word
        .charAt(0).toUpperCase() + // Capitalize first letter
        expense.description.split(' ')[0].slice(1).toLowerCase(); // Rest in lowercase

      return {
        amount: Number(expense.amount) || 0,
        category: validCategories.includes(category) ? category : 'essentials',
        description,
      };
    });
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}