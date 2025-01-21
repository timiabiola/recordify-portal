import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function transcribeAudio(audioBlob: Blob) {
  console.log('Starting audio transcription...');
  console.log('Audio blob size:', audioBlob.size);
  console.log('Audio blob type:', audioBlob.type);
  
  try {
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
      console.error('Whisper API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const prompt = `Extract expense information from this text. Return a JSON object with amount (number), description (string), and category (string). Categories should be one of: food, entertainment, transport, shopping, utilities, other. Text: "${text}"`;

    console.log('Sending request to OpenAI with model: gpt-4o-mini');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts expense information from text and returns it in a consistent format."
        },
        {
          role: "user",
          content: prompt
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
    
    try {
      const parsedResponse = JSON.parse(response);
      console.log("Successfully parsed response:", parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", {
        error: parseError,
        response: response
      });
      throw new Error("Failed to parse expense details from OpenAI response");
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      apiKey: Deno.env.get('OPENAI_API_KEY') ? 'Present' : 'Missing'
    });
    throw error;
  }
}