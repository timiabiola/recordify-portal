import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processBase64Chunks, validateAudioFormat } from './utils/audio.ts';
import { transcribeAudio, extractExpenseDetails } from './utils/openai.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Authorization required');
    }

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const { audio } = await req.json();
    if (!audio) {
      console.log('No audio data received');
      throw new Error('No audio detected. Please share the expenses you\'d like recorded and the amount!');
    }

    // Process and validate audio
    console.log('Processing audio data...');
    const { data: binaryAudio, mimeType, format } = processBase64Chunks(audio);
    
    // Check for empty audio (silence)
    if (binaryAudio.length < 1000) {
      console.log('Audio data too short - likely silence');
      throw new Error('No audio detected. Please share the expenses you\'d like recorded and the amount!');
    }
    
    // Validate format
    if (!validateAudioFormat(`file.${format}`)) {
      console.log('Invalid audio format:', format);
      throw new Error('Invalid audio format');
    }
    
    const blob = new Blob([binaryAudio], { type: mimeType });

    // Transcribe audio
    console.log('Transcribing audio...');
    const text = await transcribeAudio(blob);
    console.log('Audio transcription:', text);

    // Extract expense details
    console.log('Extracting expense details...');
    const expenses = await extractExpenseDetails(text);
    console.log('Extracted expenses:', expenses);

    if (!Array.isArray(expenses) || expenses.length === 0) {
      console.error('No valid expenses extracted');
      throw new Error('Could not understand the expense details. Please try again.');
    }

    // Save each expense
    const savedExpenses = [];
    for (const expense of expenses) {
      try {
        console.log('Processing expense:', expense);
        
        // First, ensure the category exists or create it
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', expense.category)
          .single();

        let categoryId;
        if (categoryError) {
          console.log('Category not found, creating new category:', expense.category);
          const { data: newCategory, error: createCategoryError } = await supabase
            .from('categories')
            .insert({ name: expense.category })
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
        const { data: savedExpense, error: expenseError } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            description: expense.description,
            amount: expense.amount,
            transcription: text
          })
          .select('*, categories(name)')
          .single();

        if (expenseError) {
          console.error('Error saving expense:', expenseError);
          throw expenseError;
        }

        console.log('Expense saved successfully:', savedExpense);
        savedExpenses.push(savedExpense);
      } catch (error) {
        console.error('Error processing expense:', error);
      }
    }

    if (savedExpenses.length === 0) {
      console.error('No expenses were saved successfully');
      throw new Error('Failed to save any expenses');
    }

    console.log('All expenses saved successfully:', savedExpenses);
    return new Response(
      JSON.stringify({
        success: true,
        expenses: savedExpenses
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});