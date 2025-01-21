import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function transcribeAudio(audioBlob: Blob) {
  console.log('Sending audio to Whisper API...');
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  });

  if (!whisperResponse.ok) {
    throw new Error(`Whisper API error: ${await whisperResponse.text()}`);
  }

  const { text } = await whisperResponse.json();
  console.log('Transcribed text:', text);
  return text;
}

export async function extractExpenseDetails(text: string) {
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });

  const prompt = `Extract expense information from this text. Return a JSON object with amount (number), description (string), and category (string). Categories should be one of: food, entertainment, transport, shopping, utilities, other. Text: "${text}"`;

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

  try {
    const response = completion.choices[0].message.content;
    console.log("OpenAI response:", response);
    return JSON.parse(response);
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    throw new Error("Failed to parse expense details");
  }
}