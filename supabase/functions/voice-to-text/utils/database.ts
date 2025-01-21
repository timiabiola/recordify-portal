import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const saveExpenseToDatabase = async (
  supabaseClient: any,
  userId: string,
  expenseData: any,
  transcription: string
) => {
  // First, ensure the category exists or create it
  const { data: categoryData, error: categoryError } = await supabaseClient
    .from('categories')
    .select('id')
    .eq('name', expenseData.category)
    .single();

  let categoryId;
  if (categoryError) {
    // Category doesn't exist, create it
    const { data: newCategory, error: createCategoryError } = await supabaseClient
      .from('categories')
      .insert({ name: expenseData.category })
      .select()
      .single();

    if (createCategoryError) {
      console.error('Error creating category:', createCategoryError);
      throw new Error('Failed to create category');
    }
    categoryId = newCategory.id;
  } else {
    categoryId = categoryData.id;
  }

  // Save the expense
  const { error: expenseError } = await supabaseClient
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      description: expenseData.description,
      amount: expenseData.amount,
      transcription: transcription
    });

  if (expenseError) {
    console.error('Error saving expense:', expenseError);
    throw new Error('Failed to save expense');
  }
};