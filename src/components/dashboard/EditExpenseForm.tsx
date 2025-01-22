import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "./CategorySelect";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  category_id: z.string().min(1, "Category is required"),
});

type EditExpenseFormProps = {
  expense: {
    id: string;
    description: string;
    amount: number;
    category_id: string;
  };
};

export const EditExpenseForm = ({ expense }: EditExpenseFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories');
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      console.log('Fetched categories:', data);
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expense.description,
      amount: String(expense.amount),
      category_id: expense.category_id,
    },
  });

  const updateExpense = async (values: z.infer<typeof formSchema>) => {
    console.log('Updating expense with values:', values);
    const { error } = await supabase
      .from('expenses')
      .update({
        description: values.description,
        amount: Number(values.amount),
        category_id: values.category_id,
      })
      .eq('id', expense.id);

    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      console.log('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Error in mutation:', error);
      toast.error('Failed to update expense');
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Form submitted with values:', values);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelect
                  selectedCategory={field.value}
                  onCategoryChange={field.onChange}
                  categories={categories}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
};