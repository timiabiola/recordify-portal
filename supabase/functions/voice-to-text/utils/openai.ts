import OpenAI from 'https://esm.sh/openai@4.20.1';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('Starting transcription with audio blob size:', audioBlob.size);
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    // Create form data for the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    // Make request to OpenAI's transcription API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Transcription result:', result);
    
    if (!result.text || typeof result.text !== 'string') {
      console.error('Invalid transcription result:', result);
      throw new Error('Invalid transcription result format');
    }

    return result.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}

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
          content: `You are a helpful assistant that extracts expense information from spoken text.
Your task is to identify the amount spent and categorize the expense.

Rules:
1. Amount must be a positive number
2. Remove any currency symbols or words (e.g., $, dollars, bucks)
3. Category must be one of: essentials, monthly_recurring, leisure
4. Description should be clear and specific
5. If amount or category is unclear, respond with null

Example inputs and outputs:
"I spent fifty dollars at the grocery store"
[{"amount": 50, "description": "grocery shopping", "category": "essentials"}]

"Netflix subscription is 15.99"
[{"amount": 15.99, "description": "Netflix subscription", "category": "monthly_recurring"}]

"Went to the movies yesterday twenty dollars"
[{"amount": 20, "description": "movie tickets", "category": "leisure"}]

Return ONLY a JSON array with objects containing:
{
  "amount": number (must be > 0),
  "description": string,
  "category": string (one of: essentials, monthly_recurring, leisure)
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
      throw new Error('Failed to get response from OpenAI');
    }

    console.log("OpenAI raw response:", response);
    
    try {
      const parsed = JSON.parse(response.trim());
      console.log('Parsed response:', parsed);

      // Ensure we have an array
      const expensesArray = Array.isArray(parsed) ? parsed : [parsed];

      // Validate each expense
      expensesArray.forEach(expense => {
        if (!expense || typeof expense !== 'object') {
          throw new Error('Invalid response format: not an object');
        }

        // Convert amount to number and validate
        const amount = Number(expense.amount);
        if (isNaN(amount) || amount <= 0) {
          console.error('Invalid amount:', expense.amount);
          throw new Error('Invalid amount: must be a positive number');
        }

        // Validate description
        if (!expense.description || typeof expense.description !== 'string' || expense.description.trim() === '') {
          console.error('Invalid description:', expense.description);
          throw new Error('Invalid description: must be a non-empty string');
        }

        // Validate category
        const validCategories = ['essentials', 'monthly_recurring', 'leisure'];
        if (!validCategories.includes(expense.category)) {
          console.error('Invalid category:', expense.category);
          throw new Error(`Invalid category: must be one of ${validCategories.join(', ')}`);
        }

        // Normalize the expense
        expense.amount = amount;
        expense.description = expense.description.trim();
      });

      console.log('Validated expenses:', expensesArray);
      return expensesArray;
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