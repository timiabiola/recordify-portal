import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Starting expense extraction from text:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Making OpenAI API request...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // Using the correct model name for faster, cheaper processing
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from spoken text.
Your task is to identify the amount spent and categorize the expense.

Rules for extraction:
1. Amount must be a positive number
2. Remove any currency symbols or words (e.g., $, dollars, bucks)
3. Category must be exactly one of: essentials, leisure, recurring_payments
4. Description should be clear and specific
5. If you can't confidently extract both amount and category, return null

Categorization rules:
- essentials: Basic living expenses like housing, utilities, groceries, transportation
- leisure: Entertainment, dining out, hobbies, non-essential shopping
- recurring_payments: Subscription services, memberships, regular bills

Example inputs and outputs:
"I spent fifty dollars at the grocery store"
{"amount": 50, "description": "grocery shopping", "category": "essentials"}

"Netflix subscription is 15.99"
{"amount": 15.99, "description": "Netflix subscription", "category": "recurring_payments"}

"Went to the movies yesterday twenty dollars"
{"amount": 20, "description": "movie tickets", "category": "leisure"}

"Had lunch"
null (missing amount)

"Spent some money"
null (missing amount and category)`
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

      // Return null if parsing failed or response is explicitly null
      if (!parsed) {
        console.log('Parsed response is null');
        return null;
      }

      // Validate the parsed data
      if (typeof parsed !== 'object') {
        console.error('Invalid response format: not an object');
        return null;
      }

      const amount = Number(parsed.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', parsed.amount);
        return null;
      }

      if (!parsed.description || typeof parsed.description !== 'string') {
        console.error('Invalid description');
        return null;
      }

      const validCategories = ['essentials', 'leisure', 'recurring_payments'];
      if (!validCategories.includes(parsed.category)) {
        console.error('Invalid category:', parsed.category);
        return null;
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