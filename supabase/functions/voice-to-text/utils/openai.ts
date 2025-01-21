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
                     Extract the amount, category, and description. 
                     Categories must be one of: essentials, leisure, recurring_payments.
                     Format numbers as decimal numbers without currency symbols.
                     Always return a valid JSON object with these exact fields.`
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

    const parsedContent = JSON.parse(data.choices[0].message.content);
    console.log('Parsed expense details:', parsedContent);

    // Validate and normalize the category
    const validCategories = ['essentials', 'leisure', 'recurring_payments'];
    const category = parsedContent.category?.toLowerCase() || 'essentials';
    
    if (!validCategories.includes(category)) {
      console.log('Invalid category detected, defaulting to essentials:', category);
    }

    // Capitalize the first letter of the description
    const description = parsedContent.description || text;
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);

    return {
      amount: Number(parsedContent.amount) || 0,
      category: validCategories.includes(category) ? category : 'essentials',
      description: capitalizedDescription,
    };
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}