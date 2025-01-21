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

    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Invalid input text for expense extraction');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text.
You MUST extract these fields and return them in a JSON object:
{
  "amount": number (REQUIRED: must be a positive number, remove any currency symbols),
  "description": string (REQUIRED: must be a clear description of the expense),
  "category": string (REQUIRED: must be exactly one of: essentials, monthly_recurring, leisure)
}

Example valid responses:
For "I spent $50 on groceries":
{"amount": 50, "description": "groceries", "category": "essentials"}

For "Netflix subscription for $15.99":
{"amount": 15.99, "description": "Netflix subscription", "category": "monthly_recurring"}

For "Went to the movies for 20 dollars":
{"amount": 20, "description": "movie tickets", "category": "leisure"}

Rules:
1. Amount must be a number without currency symbols
2. Description must be clear and specific
3. Category must be exactly one of the three options
4. Return ONLY the JSON object, no other text`
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

      // Validate amount - ensure it's a positive number
      const amount = Number(parsed.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', parsed.amount);
        throw new Error('Invalid amount: must be a positive number');
      }

      // Validate description
      if (!parsed.description || typeof parsed.description !== 'string' || parsed.description.trim() === '') {
        console.error('Invalid description:', parsed.description);
        throw new Error('Invalid description: must be a non-empty string');
      }

      // Validate category
      const validCategories = ['essentials', 'monthly_recurring', 'leisure'];
      if (!validCategories.includes(parsed.category)) {
        console.error('Invalid category:', parsed.category);
        throw new Error(`Invalid category: must be one of ${validCategories.join(', ')}`);
      }

      // Clean and normalize the data
      const normalizedExpense = {
        amount: amount,
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