import { checkRateLimit } from './rateLimiting.ts';
import { parseOpenAIResponse } from './jsonParser.ts';

export async function extractExpenseDetails(text: string) {
  console.log('Starting expense extraction from text:', text);
  
  try {
    checkRateLimit();

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

    const data = await completion.json();
    console.log('OpenAI raw response:', JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const response = data.choices[0].message.content;
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