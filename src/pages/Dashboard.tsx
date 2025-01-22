import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { CategorySelect } from "@/components/dashboard/CategorySelect";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Generate last 12 months for the dropdown
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });

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
    queryKey: ["expenses", selectedCategory, selectedMonth],
    queryFn: async () => {
      console.log("Fetching expenses with filters:", { selectedCategory, selectedMonth });
      let query = supabase
        .from("expenses")
        .select(`
          *,
          categories (
            name
          )
        `)
        .gte('created_at', startOfMonth(selectedMonth).toISOString())
        .lte('created_at', endOfMonth(selectedMonth).toISOString())
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
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground">{format(selectedMonth, 'MMMM yyyy')}</p>
        </div>
        <Select
          value={selectedMonth.toISOString()}
          onValueChange={(value) => setSelectedMonth(new Date(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {last12Months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <ExpensesPieChart expenses={expenses} selectedMonth={selectedMonth} />
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
            <CategorySelect
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={setSelectedCategory}
              showAllOption={true}
            />
          </div>
          <ExpensesTable expenses={expenses} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;