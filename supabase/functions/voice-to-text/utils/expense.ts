import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ExpenseDetails {
  amount: number;
  category: string;
  description: string;
}

export async function saveExpense(
  supabaseAdmin: SupabaseClient,
  userId: string,
  expenseDetails: ExpenseDetails,
  transcription: string
) {
  try {
    console.log('Starting saveExpense with:', { userId, expenseDetails, transcription });
    
    // Get category id
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', expenseDetails.category)
      .single();

    if (categoryError) {
      console.error('Error fetching category:', categoryError);
      throw new Error(`Category not found: ${expenseDetails.category}`);
    }

    if (!categoryData?.id) {
      console.error('No category found for:', expenseDetails.category);
      throw new Error(`Invalid category: ${expenseDetails.category}`);
    }

    console.log('Found category ID:', categoryData.id);

    // Save expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: userId,
        category_id: categoryData.id,
        amount: expenseDetails.amount,
        description: expenseDetails.description,
        transcription: transcription
      })
      .select('*, categories(name)')
      .single();

    if (expenseError) {
      console.error('Error saving expense:', expenseError);
      throw new Error(`Error saving expense: ${expenseError.message}`);
    }

    if (!expense) {
      throw new Error('No expense returned after saving');
    }

    console.log('Expense saved successfully:', expense);
    return expense;
  } catch (error) {
    console.error('Error in saveExpense:', error);
    throw error;
  }
}