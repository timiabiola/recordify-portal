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
          content: `You are a helpful assistant that categorizes expenses into exactly one of these three categories:
          
1. essentials: Items an adult in North America would consider "needs" including:
   - Bills, mortgage, rent
   - Groceries
   - Essential daily living items
   - Car payments, insurance
   - Clothing, personal grooming
   - Healthcare expenses

2. monthly_recurring:
   - Subscription services (Netflix, Disney+, etc.)
   - Monthly memberships
   - Regular recurring payments

3. leisure:
   - Entertainment (movies, concerts)
   - Dining out, restaurants
   - Hobbies and recreation
   - Non-essential shopping

Return a valid JSON array containing exactly one expense object with these fields:
{
  "amount": number,
  "description": string,
  "category": string (one of: essentials, monthly_recurring, leisure)
}`
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

      const validExpenses = parsed.filter(expense => {
        const isValid = 
          typeof expense === 'object' &&
          expense !== null &&
          typeof expense.amount === 'number' && 
          typeof expense.description === 'string' && 
          typeof expense.category === 'string' &&
          ['essentials', 'monthly_recurring', 'leisure'].includes(expense.category);
        
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