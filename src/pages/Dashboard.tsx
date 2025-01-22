import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, ArrowLeft } from "lucide-react";

const Dashboard = () => {
  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/">
          <Button className="gap-2">
            <Mic className="w-4 h-4" />
            Record Expense
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
          <ExpensesTable expenses={expenses} />
        </div>
        
        <ExpensesPieChart expenses={expenses} />
      </div>
    </div>
  );
};

export default Dashboard;