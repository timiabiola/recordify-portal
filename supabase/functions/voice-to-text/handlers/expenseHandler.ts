import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractExpenseDetails } from "../utils/expenseExtraction.ts";

export async function saveExpense(userId: string, transcriptionText: string) {
  console.log('Extracting expense details from:', transcriptionText);
  const expenseDetails = await extractExpenseDetails(transcriptionText);
  console.log('Extracted expense details:', expenseDetails);

  if (!expenseDetails) {
    throw new Error('Could not understand the expense details');
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

  // Save expense
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

  console.log('Expense saved successfully:', expense);
  return expense;
}