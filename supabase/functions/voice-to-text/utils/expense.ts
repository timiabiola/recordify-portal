import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function saveExpense(
  supabaseAdmin: SupabaseClient,
  userId: string,
  expenseDetails: { amount: number; category: string; description: string },
  transcription: string
) {
  try {
    // Get category id or create new category
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', expenseDetails.category)
      .single();

    if (categoryError && categoryError.code !== 'PGRST116') {
      throw new Error(`Error fetching category: ${categoryError.message}`);
    }

    let categoryId = categoryData?.id;

    if (!categoryId) {
      const { data: newCategory, error: createError } = await supabaseAdmin
        .from('categories')
        .insert({ name: expenseDetails.category })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Error creating category: ${createError.message}`);
      }
      categoryId = newCategory.id;
    }

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
      .select('*')
      .single();

    if (expenseError) {
      throw new Error(`Error saving expense: ${expenseError.message}`);
    }

    return expense;
  } catch (error) {
    console.error('Error in saveExpense:', error);
    throw error;
  }
}