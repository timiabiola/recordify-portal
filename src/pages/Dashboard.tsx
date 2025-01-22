import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { CategorySelect } from "@/components/dashboard/CategorySelect";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories...");
      const { data, error } = await supabase
        .from("categories")
        .select("*");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      console.log("Categories fetched:", data);
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses", selectedCategory],
    queryFn: async () => {
      console.log("Fetching expenses with category filter:", selectedCategory);
      let query = supabase
        .from("expenses")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }
      console.log("Expenses fetched:", data);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
            <CategorySelect
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={setSelectedCategory}
            />
          </div>
          <ExpensesTable expenses={expenses} />
        </div>
        
        <ExpensesPieChart expenses={expenses} />
      </div>
    </div>
  );
};

export default Dashboard;