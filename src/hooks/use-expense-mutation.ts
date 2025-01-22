import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ExpenseData = {
  description: string;
  amount: number;
  category_id: string;
};

export const useExpenseMutation = (expenseId: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ExpenseData) => {
      console.log('Updating expense with values:', values);
      const { error } = await supabase
        .from('expenses')
        .update({
          description: values.description,
          amount: values.amount,
          category_id: values.category_id,
        })
        .eq('id', expenseId);

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      toast.error('Failed to update expense');
    },
  });
};