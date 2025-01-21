import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0';

export const createOpenAIClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Missing OpenAI API Key');
  }
  const configuration = new Configuration({ apiKey });
  return new OpenAIApi(configuration);
};

export const transcribeAudio = async (openai: OpenAIApi, audioBuffer: Uint8Array) => {
  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  console.log('Sending request to Whisper API...');
  
  try {
    const transcriptionResponse = await openai.createTranscription(
      // @ts-ignore: FormData is not properly typed in OpenAI's types
      formData,
      'whisper-1'
    );

    if (!transcriptionResponse?.data?.text) {
      throw new Error('Invalid response from Whisper API');
    }

    console.log('Transcription successful:', JSON.stringify({
      text: transcriptionResponse.data.text
    }));

    return transcriptionResponse.data.text;
  } catch (error) {
    console.error('Transcription error:', JSON.stringify({
      message: error?.message,
      response: error?.response?.data
    }));
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
};

export const parseExpenseWithGPT = async (openai: OpenAIApi, transcription: string) => {
  console.log('Sending transcription to GPT API:', JSON.stringify({ transcription }));
  
  try {
    const parseResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text. 
          Extract the amount (as a number), description (as text), and category (must be one of: food, transport, entertainment, shopping, utilities, other).
          If a category isn't explicitly mentioned, infer it from the description.
          Return only a JSON object with these three fields.`
        },
        {
          role: "user",
          content: transcription
        }
      ]
    });

    const parsedText = parseResponse?.data?.choices?.[0]?.message?.content;
    if (!parsedText) {
      throw new Error('Invalid response from GPT API');
    }

    console.log('GPT response received:', JSON.stringify({ parsedText }));

    try {
      const expenseData = JSON.parse(parsedText);
      if (!expenseData?.amount || !expenseData?.description || !expenseData?.category) {
        throw new Error('Missing required fields in parsed expense data');
      }
      return expenseData;
    } catch (e) {
      console.error('JSON parsing error:', JSON.stringify({
        message: e?.message,
        parsedText
      }));
      throw new Error('Failed to parse expense data');
    }
  } catch (error) {
    console.error('GPT API error:', JSON.stringify({
      message: error?.message,
      response: error?.response?.data
    }));
    throw new Error('Failed to parse expense with GPT: ' + error.message);
  }
};