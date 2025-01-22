import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Starting expense extraction from text:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from text.
Extract the amount spent and categorize the expense into one of these categories exactly:
- food
- entertainment
- transport
- shopping
- utilities
- other

Rules:
1. Amount must be a positive number
2. Remove any currency symbols
3. Description should be clear and concise
4. If amount or category is unclear, return null
5. Category must be exactly one of the listed options, in lowercase

Example inputs and outputs:
"I spent fifty dollars at the grocery store"
{"amount": 50, "description": "grocery shopping", "category": "food"}

"Netflix subscription is 15.99"
{"amount": 15.99, "description": "Netflix subscription", "category": "entertainment"}

Return ONLY a JSON object with these exact fields:
{
  "amount": number,
  "description": string,
  "category": string
}`
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
      return null;
    }

    console.log('OpenAI raw response:', response);
    
    try {
      const parsed = JSON.parse(response.trim());
      console.log('Parsed expense details:', parsed);

      // Validate the parsed data
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format');
      }

      const amount = Number(parsed.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (!parsed.description || typeof parsed.description !== 'string') {
        throw new Error('Invalid description');
      }

      const validCategories = ['food', 'entertainment', 'transport', 'shopping', 'utilities', 'other'];
      if (!validCategories.includes(parsed.category)) {
        throw new Error('Invalid category');
      }

      return {
        amount,
        description: parsed.description.trim(),
        category: parsed.category
      };
    } catch (parseError) {
      console.error('Failed to parse expense details:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    return null;
  }
}