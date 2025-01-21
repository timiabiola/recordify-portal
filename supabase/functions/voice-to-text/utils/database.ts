import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function saveExpense(supabaseAdmin: any, userId: string, expenseDetails: any, text: string) {
  // First, ensure the category exists or create it
  console.log('Looking up category:', expenseDetails.category);
  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', expenseDetails.category)
    .single();

  let categoryId;
  if (categoryError) {
    console.log('Category not found, creating new category');
    const { data: newCategory, error: createCategoryError } = await supabaseAdmin
      .from('categories')
      .insert({ name: expenseDetails.category })
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

  console.log('Using category ID:', categoryId);

  // Create the expense record
  const { data: expense, error: expenseError } = await supabaseAdmin
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      description: expenseDetails.description,
      amount: expenseDetails.amount,
      transcription: text
    })
    .select()
    .single();

  if (expenseError) {
    console.error('Error creating expense:', expenseError);
    throw expenseError;
  }

  console.log('Expense created successfully:', expense);
  return expense;
}