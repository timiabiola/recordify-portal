import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const isMobile = useIsMobile();
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
    <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Link to="/">
          <Button className="w-full sm:w-auto gap-2">
            <Mic className="h-4 w-4" />
            Record Expense
          </Button>
        </Link>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
          <ExpensesTable expenses={expenses} />
        </div>
        
        <ExpensesPieChart expenses={expenses} />
      </div>
    </div>
  );
};

export default Dashboard;