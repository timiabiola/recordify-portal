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
          Return a single expense object with these exact fields:
          {
            "amount": number,
            "description": string,
            "category": string (must be exactly one of: essentials, monthly_recurring, leisure)
          }
          
          Categorization rules:
          - essentials: Bills, mortgage, rent, groceries, essential daily items, car payments, insurance, clothing, personal grooming, healthcare
          - monthly_recurring: Subscription services (Netflix, etc), monthly memberships, regular recurring payments
          - leisure: Entertainment, dining out, hobbies, non-essential shopping
          
          Return ONLY the JSON object, no additional text or formatting.`
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
      
      // Validate the expense object
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format: not an object');
      }

      if (typeof parsed.amount !== 'number') {
        throw new Error('Invalid amount: must be a number');
      }

      if (typeof parsed.description !== 'string' || !parsed.description) {
        throw new Error('Invalid description: must be a non-empty string');
      }

      if (!['essentials', 'monthly_recurring', 'leisure'].includes(parsed.category)) {
        throw new Error('Invalid category: must be essentials, monthly_recurring, or leisure');
      }

      console.log('Validated expense:', parsed);
      return [parsed]; // Return as array for compatibility with existing code
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse expense details: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}