import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractExpenseDetails } from "../utils/expenseExtraction.ts";

export async function saveExpense(userId: string, transcriptionText: string) {
  console.log('Extracting expense details from:', transcriptionText);
  const expenses = await extractExpenseDetails(transcriptionText);
  console.log('Extracted expenses:', expenses);

  if (!expenses || expenses.length === 0) {
    throw new Error('Could not understand the expense details');
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const savedExpenses = [];

  // Save each expense, but check for duplicates first
  for (const expenseDetails of expenses) {
    // Get category id
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', expenseDetails.category)
      .single();

    if (categoryError || !categoryData) {
      console.error('Error finding category:', categoryError);
      throw new Error('Invalid expense category');
    }

    // Check for duplicate entries within a 5-second window
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data: existingExpenses, error: checkError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryData.id)
      .eq('amount', expenseDetails.amount)
      .eq('description', expenseDetails.description)
      .gte('created_at', fiveSecondsAgo);

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
      throw new Error('Failed to check for duplicate expenses');
    }

    // Only save if no recent duplicate exists
    if (!existingExpenses || existingExpenses.length === 0) {
      console.log('No duplicate found, saving expense:', expenseDetails);
      const { data: expense, error: expenseError } = await supabaseAdmin
        .from('expenses')
        .insert({
          user_id: userId,
          category_id: categoryData.id,
          amount: expenseDetails.amount,
          description: expenseDetails.description,
          transcription: transcriptionText
        })
        .select('*, categories(name)')
        .single();

      if (expenseError) {
        console.error('Error saving expense:', expenseError);
        throw new Error('Failed to save expense');
      }

      console.log('Expense saved:', expense);
      savedExpenses.push(expense);
    } else {
      console.log('Duplicate expense detected, skipping:', expenseDetails);
    }
  }

  return savedExpenses;
}