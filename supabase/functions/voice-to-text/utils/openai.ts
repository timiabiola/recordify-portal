import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Extracting expense details from:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new Error('Invalid input text for expense extraction');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text.
Extract ONLY numerical amount, description, and category from the text.
Return a JSON object with these exact fields:
{
  "amount": number (extract only the numerical value, no currency symbols, must be > 0),
  "description": string (clear description of what was purchased),
  "category": string (must be exactly one of: essentials, monthly_recurring, leisure)
}

Examples:
"Spent fifty dollars at the grocery store"
{"amount": 50, "description": "grocery shopping", "category": "essentials"}

"My Netflix subscription is 15.99"
{"amount": 15.99, "description": "Netflix subscription", "category": "monthly_recurring"}

"Bought movie tickets for twenty bucks"
{"amount": 20, "description": "movie tickets", "category": "leisure"}

Rules:
1. Convert all word numbers to digits (e.g., "fifty" → 50)
2. Remove currency symbols and words ($, dollars, bucks)
3. Description must be specific and clear
4. Category must be exact match from the list
5. Return ONLY the JSON object, no other text`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI');
      throw new Error('Failed to get response from OpenAI');
    }

    console.log("OpenAI raw response:", response);
    
    try {
      const parsed = JSON.parse(response.trim());
      console.log('Parsed response:', parsed);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format: not an object');
      }

      // Convert amount to number and validate
      const amount = Number(parsed.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', parsed.amount);
        throw new Error('Invalid amount: must be a positive number');
      }

      // Validate description
      if (!parsed.description || typeof parsed.description !== 'string' || parsed.description.trim() === '') {
        console.error('Invalid description:', parsed.description);
        throw new Error('Invalid description: must be a non-empty string');
      }

      // Validate category
      const validCategories = ['essentials', 'monthly_recurring', 'leisure'];
      if (!validCategories.includes(parsed.category)) {
        console.error('Invalid category:', parsed.category);
        throw new Error(`Invalid category: must be one of ${validCategories.join(', ')}`);
      }

      const normalizedExpense = {
        amount: amount,
        description: parsed.description.trim(),
        category: parsed.category
      };

      console.log('Normalized expense:', normalizedExpense);
      return [normalizedExpense];
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', {
        error: parseError,
        rawResponse: response
      });
      throw new Error('Failed to parse expense details: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}