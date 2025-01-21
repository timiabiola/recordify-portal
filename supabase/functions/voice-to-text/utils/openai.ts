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
    
    if (!result.text || typeof result.text !== 'string' || result.text.trim() === '') {
      throw new Error('Invalid transcription: empty or invalid text');
    }
    
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

    // First, validate the input text
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Invalid input text for expense extraction');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text.
Extract ONLY these fields and return them in a JSON object:
{
  "amount": number (required, must be positive),
  "description": string (required, must be descriptive),
  "category": string (required, must be exactly one of: essentials, monthly_recurring, leisure)
}

Categorization rules:
- essentials: Bills, mortgage, rent, groceries, essential daily items, car payments, insurance, clothing, personal grooming, healthcare
- monthly_recurring: Subscription services (Netflix, etc), monthly memberships, regular recurring payments
- leisure: Entertainment, dining out, hobbies, non-essential shopping

If you cannot extract all required fields, return an error message instead.
DO NOT include any markdown formatting or explanation text.`
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
      throw new Error('Failed to get response from OpenAI');
    }

    console.log('OpenAI raw response:', response);
    
    try {
      const parsed = JSON.parse(response.trim());
      console.log('Parsed response:', parsed);
      
      // Validate the expense object structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format: not an object');
      }

      // Validate amount
      if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
        throw new Error('Invalid amount: must be a positive number');
      }

      // Validate description
      if (!parsed.description || typeof parsed.description !== 'string' || parsed.description.trim() === '') {
        throw new Error('Invalid description: must be a non-empty string');
      }

      // Validate category
      const validCategories = ['essentials', 'monthly_recurring', 'leisure'];
      if (!validCategories.includes(parsed.category)) {
        throw new Error(`Invalid category: must be one of ${validCategories.join(', ')}`);
      }

      // Clean and normalize the data
      const normalizedExpense = {
        amount: Number(parsed.amount),
        description: parsed.description.trim(),
        category: parsed.category
      };

      console.log('Validated and normalized expense:', normalizedExpense);
      return [normalizedExpense]; // Return as array for compatibility with existing code
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse expense details: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}