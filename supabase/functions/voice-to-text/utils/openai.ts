import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function transcribeAudio(audioBlob: Blob) {
  console.log('Starting audio transcription...');
  
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Whisper API error response:', errorData);
      throw new Error(`Whisper API error: ${errorData}`);
    }

    const { text } = await response.json();
    console.log('Successfully transcribed text:', text);
    return text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
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

    console.log('OpenAI response:', completion);

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const response = completion.choices[0].message.content;
    console.log("Parsed OpenAI response:", response);
    
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Failed to parse expense details from OpenAI response");
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    throw error;
  }
}