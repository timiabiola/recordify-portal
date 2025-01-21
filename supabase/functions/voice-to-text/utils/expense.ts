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
    console.log('Saving expense:', { userId, expenseDetails, transcription });
    
    // Get category id or create new category
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .ilike('name', expenseDetails.category)
      .single();

    if (categoryError && categoryError.code !== 'PGRST116') {
      console.error('Error fetching category:', categoryError);
      throw new Error(`Error fetching category: ${categoryError.message}`);
    }

    let categoryId = categoryData?.id;

    if (!categoryId) {
      console.log('Category not found, creating new category:', expenseDetails.category);
      const { data: newCategory, error: createError } = await supabaseAdmin
        .from('categories')
        .insert({ name: expenseDetails.category })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating category:', createError);
        throw new Error(`Error creating category: ${createError.message}`);
      }
      categoryId = newCategory.id;
    }

    console.log('Using category ID:', categoryId);

    // Save expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: userId,
        category_id: categoryId,
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

    console.log('Expense saved successfully:', expense);
    return expense;
  } catch (error) {
    console.error('Error in saveExpense:', error);
    throw error;
  }
}