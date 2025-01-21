import { checkRateLimit } from './rateLimiting.ts';
import { parseOpenAIResponse } from './jsonParser.ts';

export async function extractExpenseDetails(text: string) {
  console.log('Starting expense extraction from text:', text);
  
  try {
    checkRateLimit();

    const systemPrompt = `You are a literal expense parser that extracts EXACTLY what was spoken. Your only task is to:
1. Extract the EXACT amount mentioned (e.g. if someone says $175, use 175, not a different number)
2. Use the EXACT description of what was mentioned (e.g. if someone says "groceries", use "groceries", not "food shopping")
3. Map to the closest category

Rules:
- NEVER modify the spoken amount
- NEVER modify the spoken description
- NEVER add extra words or context
- Return pure JSON only`;

    const userPrompt = `Parse this expense exactly as spoken and return a JSON object with:
- amount: the EXACT number mentioned (e.g. if they say $175, use 175)
- description: the EXACT item mentioned (e.g. if they say "groceries", use "groceries")
- category: map to: food, entertainment, transport, shopping, utilities, other

Text: "${text}"

Return ONLY the JSON object. No explanation, no markdown.`;

    console.log('Sending request to OpenAI with model: gpt-4o-mini');
    
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0, // Set to 0 for most deterministic, literal response
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
    console.log('OpenAI extracted content:', response);
    
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