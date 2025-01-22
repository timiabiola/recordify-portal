import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditExpenseForm } from "@/components/dashboard/EditExpenseForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const EditExpense = () => {
  const { id } = useParams<{ id: string }>();

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      console.log('Fetching expense with id:', id);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error('Error fetching expense:', error);
        throw error;
      }

      console.log('Fetched expense:', data);
      return data;
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!expense) {
    return <div className="p-4">Expense not found</div>;
  }

  return (
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Expense</h1>
      </div>
      <EditExpenseForm expense={expense} />
    </div>
  );
};

export default EditExpense;