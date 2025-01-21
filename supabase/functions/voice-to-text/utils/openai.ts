import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { checkRateLimit } from './rateLimiting.ts';
import { parseOpenAIResponse } from './jsonParser.ts';

export async function transcribeAudio(audioBlob: Blob) {
  console.log('Starting audio transcription...');
  console.log('Audio blob size:', audioBlob.size);
  console.log('Audio blob type:', audioBlob.type);
  
  try {
    checkRateLimit();

    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
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
      const errorData = await response.text();
      console.error('Whisper API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      if (response.status === 429) {
        throw new Error('OpenAI rate limit reached. Please try again later.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      }
      
      throw new Error(`Whisper API error: ${errorData}`);
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
  console.log('Starting expense extraction from text:', text);
  
  try {
    checkRateLimit();

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const systemPrompt = `You are a helpful assistant that extracts expense information from text and returns it in pure JSON format. 
Never include markdown formatting, code blocks, or backticks in your response. 
Return only valid JSON that can be directly parsed.`;

    const userPrompt = `Extract expense information from this text and return a JSON object with:
- amount (number)
- description (string)
- category (string, one of: food, entertainment, transport, shopping, utilities, other)

Text: "${text}"

Remember to return ONLY the JSON object, no markdown or code blocks.`;

    console.log('Sending request to OpenAI with model: gpt-4o-mini');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.1,
    });

    console.log('OpenAI raw response:', JSON.stringify(completion, null, 2));

    if (!completion.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', completion);
      throw new Error('Invalid response format from OpenAI');
    }

    const response = completion.choices[0].message.content;
    console.log("OpenAI extracted content:", response);
    
    return parseOpenAIResponse(response);
  } catch (error) {
    console.error('Error in extractExpenseDetails:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.message.includes('rate limit')) {
      throw new Error('OpenAI rate limit reached. Please try again later.');
    } else if (error.message.includes('invalid')) {
      throw new Error('OpenAI API key is invalid or expired.');
    }
    
    throw error;
  }
}