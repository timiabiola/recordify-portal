import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, userId } = await req.json();
    console.log('Processing request for user:', userId);
    
    if (!audio || !userId) {
      throw new Error('Audio and userId are required');
    }

    // For testing, simulate expense extraction
    // In a real implementation, this would use OpenAI's Whisper API
    const mockExpense = {
      amount: 25.99,
      description: "Test expense from voice recording",
      category: "food"
    };

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, ensure the category exists or create it
    console.log('Looking up category:', mockExpense.category);
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', mockExpense.category)
      .single();

    let categoryId;
    if (categoryError) {
      console.log('Category not found, creating new category');
      const { data: newCategory, error: createCategoryError } = await supabaseAdmin
        .from('categories')
        .insert({ name: mockExpense.category })
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
        description: mockExpense.description,
        amount: mockExpense.amount,
        transcription: "Mock transcription" // In real implementation, this would be the actual transcription
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      throw expenseError;
    }

    console.log('Expense created successfully:', expense);

    return new Response(
      JSON.stringify({
        success: true,
        expense: expense
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: corsHeaders,
        status: 400
      }
    );
  }
});