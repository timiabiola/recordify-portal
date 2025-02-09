
import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function extractExpenseDetails(text: string) {
  try {
    console.log('Starting expense extraction from text:', text);
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Making OpenAI API request...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // This is the correct model name
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts expense information from spoken text.
Extract the amount and category from the expense description and return ONLY a JSON array containing objects with this exact structure, nothing else:
{
  "amount": number,
  "description": string,
  "category": string (must be exactly one of: essentials, leisure, recurring_payments)
}

Rules:
1. Amount must be a positive number
2. Remove any currency symbols
3. Category must be exactly one of: essentials, leisure, recurring_payments
4. Description should be clear and concise
5. Return ONLY the JSON array, no other text
6. Do not include any explanations or additional text, just the JSON array

Example input: "I spent fifty dollars at the grocery store"
Example output: [{"amount": 50, "description": "grocery shopping", "category": "essentials"}]

Example input: "Netflix subscription is 15.99"
Example output: [{"amount": 15.99, "description": "Netflix subscription", "category": "recurring_payments"}]`
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
      // Clean the response to ensure we only parse the JSON array
      const cleanedResponse = response.trim().replace(/^```json\n?|\n?```$/g, '');
      const parsed = JSON.parse(cleanedResponse);
      console.log('Parsed expense details:', parsed);

      // Ensure we have an array
      const expensesArray = Array.isArray(parsed) ? parsed : [parsed];

      // Validate each expense
      const validExpenses = expensesArray.filter(expense => {
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

      if (validExpenses.length === 0) {
        console.error('No valid expenses found in response');
        return null;
      }

      console.log('Validated expenses:', validExpenses);
      return validExpenses;
    } catch (parseError) {
      console.error('Failed to parse expense details:', parseError, 'Raw response:', response);
      return null;
    }
  } catch (error) {
    console.error('Error in extractExpenseDetails:', error);
    return null;
  }
}
