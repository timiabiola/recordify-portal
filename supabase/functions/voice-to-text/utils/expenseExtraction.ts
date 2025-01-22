import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Starting expense extraction from text:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Making OpenAI API request...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from spoken text.
Your task is to identify ALL expenses mentioned in the text and categorize them.

Rules for extraction:
1. Amount must be a positive number
2. Remove any currency symbols or words (e.g., $, dollars, bucks)
3. Category must be exactly one of: essentials, leisure, recurring_payments
4. Description should be clear and specific
5. If you can't confidently extract both amount and category for an expense, exclude it
6. Return ALL valid expenses found in the text as an array

Categorization rules:
- essentials: Basic living expenses like housing, utilities, groceries, transportation
- leisure: Entertainment, dining out, hobbies, non-essential shopping
- recurring_payments: Subscription services, memberships, regular bills

Example inputs and outputs:
"I spent fifty dollars at the grocery store and twenty on movies"
[
  {"amount": 50, "description": "grocery shopping", "category": "essentials"},
  {"amount": 20, "description": "movies", "category": "leisure"}
]

"Netflix subscription is 15.99 and groceries were 100"
[
  {"amount": 15.99, "description": "Netflix subscription", "category": "recurring_payments"},
  {"amount": 100, "description": "groceries", "category": "essentials"}
]`
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

      // Ensure we have an array
      if (!Array.isArray(parsed)) {
        console.error('Invalid response format: not an array');
        return null;
      }

      // Validate each expense
      const validExpenses = parsed.filter(expense => {
        if (!expense || typeof expense !== 'object') {
          console.error('Invalid expense format:', expense);
          return false;
        }

        const amount = Number(expense.amount);
        if (isNaN(amount) || amount <= 0) {
          console.error('Invalid amount:', expense.amount);
          return false;
        }

        if (!expense.description || typeof expense.description !== 'string') {
          console.error('Invalid description');
          return false;
        }

        const validCategories = ['essentials', 'leisure', 'recurring_payments'];
        if (!validCategories.includes(expense.category)) {
          console.error('Invalid category:', expense.category);
          return false;
        }

        // Normalize the expense
        expense.amount = amount;
        expense.description = expense.description.trim();
        return true;
      });

      console.log('Validated expenses:', validExpenses);
      return validExpenses;
    } catch (parseError) {
      console.error('Failed to parse expense details:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    return null;
  }
}