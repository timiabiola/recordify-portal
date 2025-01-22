import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DeleteExpenseParams = {
  id: string;
  archive?: boolean;
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archive = true }: DeleteExpenseParams) => {
      console.log('Updating expense:', { id, archive });
      const { error } = await supabase
        .from('expenses')
        .update({ archived: archive })
        .eq('id', id);

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }
    },
    onSuccess: (_, { archive }) => {
      console.log('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(archive ? 'Expense archived successfully' : 'Expense restored successfully');
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      toast.error('Failed to update expense');
    },
  });
};