import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { checkRateLimit } from './rateLimiting.ts';

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