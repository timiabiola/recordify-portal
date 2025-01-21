import { checkRateLimit } from './rateLimiting.ts';
import { parseOpenAIResponse } from './jsonParser.ts';

export async function extractExpenseDetails(text: string) {
  console.log('Starting expense extraction from text:', text);
  
  try {
    checkRateLimit();

    const systemPrompt = `You are a helpful assistant that extracts expense information from transcribed speech. Your task is to:
1. Extract the exact numerical amount mentioned
2. Identify the category of expense
3. Create a clear description based on the mentioned item or category
4. Return the data in pure JSON format

Important rules:
- Never modify the amount - use exactly what was spoken
- Keep descriptions simple and literal
- Never include markdown or code blocks in response
- Return only valid JSON`;

    const userPrompt = `Extract expense information from this transcribed speech and return a JSON object with:
- amount (number, exactly as spoken)
- description (string, simple and literal)
- category (string, one of: food, entertainment, transport, shopping, utilities, other)

Text: "${text}"

Remember:
1. Use the exact amount mentioned
2. Keep descriptions literal and simple
3. Return ONLY the JSON object, no markdown or code blocks`;

    console.log('Sending request to OpenAI with model: gpt-4o-mini');
    
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!completion.ok) {
      const errorData = await completion.text();
      console.error('OpenAI API error:', {
        status: completion.status,
        statusText: completion.statusText,
        error: errorData
      });

      if (completion.status === 429) {
        throw new Error('OpenAI rate limit reached. Please try again later.');
      } else if (completion.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      }
      
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    let data;
    try {
      data = await completion.json();
      console.log('OpenAI raw response:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.error('Failed to parse OpenAI API response:', jsonError);
      throw new Error('Invalid JSON response from OpenAI API');
    }

    if (!data?.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const response = data.choices[0].message.content;
    console.log("OpenAI extracted content:", response);
    
    try {
      return parseOpenAIResponse(response);
    } catch (parseError) {
      console.error('Failed to parse expense details:', {
        error: parseError,
        rawResponse: response
      });
      throw new Error('Failed to parse expense details from OpenAI response: ' + parseError.message);
    }
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