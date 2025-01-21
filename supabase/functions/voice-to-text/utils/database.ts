import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const saveExpenseToDatabase = async (
  supabaseClient: any,
  userId: string,
  expenseData: any,
  transcription: string
) => {
  try {
    console.log('Saving expense:', JSON.stringify({
      userId,
      expenseData,
      transcription
    }));

    // First, ensure the category exists or create it
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('name', expenseData.category)
      .single();

    let categoryId;
    if (categoryError) {
      console.log('Category not found, creating new category:', expenseData.category);
      // Category doesn't exist, create it
      const { data: newCategory, error: createCategoryError } = await supabaseClient
        .from('categories')
        .insert({ name: expenseData.category })
        .select()
        .single();

      if (createCategoryError) {
        console.error('Error creating category:', JSON.stringify(createCategoryError));
        throw new Error('Failed to create category');
      }
      categoryId = newCategory.id;
    } else {
      categoryId = categoryData.id;
    }

    console.log('Using category ID:', categoryId);

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
      console.error('Error saving expense:', JSON.stringify(expenseError));
      throw new Error('Failed to save expense');
    }

    console.log('Expense saved successfully');
  } catch (error) {
    console.error('Database operation failed:', JSON.stringify({
      message: error?.message,
      details: error?.details
    }));
    throw error;
  }
};