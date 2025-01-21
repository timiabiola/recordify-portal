import { corsHeaders } from '../config.ts';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  console.log('Starting audio transcription...');
  console.log('Audio blob size:', audioBlob.size);
  console.log('Audio blob type:', audioBlob.type);

  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    console.log('Sending request to Whisper API...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error response:', errorText);
      throw new Error(`Whisper API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Whisper API response:', data);
    
    if (!data.text) {
      console.error('Invalid Whisper API response format:', data);
      throw new Error('Invalid response format from Whisper API');
    }

    console.log('Successfully transcribed text:', data.text);
    return data.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function extractExpenseDetails(text: string) {
  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Extracting expense details from text:', text);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that extracts expense information from text. 
                     Extract the amount, category, and description. 
                     Respond with a JSON object containing these fields.
                     If a field is not found, use null.
                     Categories should be one of: food, transport, shopping, entertainment, bills, other.
                     Format numbers as decimal strings without currency symbols.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI API response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI API response format:', data);
      throw new Error('Invalid response format from OpenAI API');
    }

    const parsedContent = JSON.parse(data.choices[0].message.content);
    console.log('Parsed expense details:', parsedContent);

    return {
      amount: parsedContent.amount,
      category: parsedContent.category?.toLowerCase() || 'other',
      description: parsedContent.description || text,
    };
  } catch (error) {
    console.error('Error in extractExpenseDetails:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}