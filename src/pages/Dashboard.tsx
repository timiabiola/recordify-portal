import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpensesTable } from "@/components/dashboard/ExpensesTable";
import { ExpensesPieChart } from "@/components/dashboard/ExpensesPieChart";
import { CategorySelect } from "@/components/dashboard/CategorySelect";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

const Dashboard = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dateRangeType, setDateRangeType] = useState<'monthly' | 'ytd' | 'ttm'>('monthly');

  // Generate last 12 months for the dropdown
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });

  // Calculate date ranges based on selected type
  const getDateRange = (): DateRange => {
    const now = new Date();
    
    switch (dateRangeType) {
      case 'ytd':
        return {
          start: startOfYear(now),
          end: now,
          label: `YTD ${format(now, 'yyyy')}`
        };
      case 'ttm':
        return {
          start: startOfMonth(subMonths(now, 11)),
          end: endOfMonth(now),
          label: 'Last 12 Months'
        };
      case 'monthly':
      default:
        return {
          start: startOfMonth(selectedMonth),
          end: endOfMonth(selectedMonth),
          label: format(selectedMonth, 'MMMM yyyy')
        };
    }
  };

  const dateRange = getDateRange();

  const handleBackClick = () => {
    // If we're in a filtered view, go back to the main dashboard view
    if (dateRangeType !== 'monthly' || selectedCategory !== 'all') {
      setDateRangeType('monthly');
      setSelectedMonth(new Date());
      setSelectedCategory('all');
    } else {
      // If we're in the default view, navigate to the home page
      navigate('/');
    }
  };

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
    queryKey: ["expenses", selectedCategory, dateRange],
    queryFn: async () => {
      console.log("Fetching expenses with filters:", { 
        selectedCategory, 
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          type: dateRangeType
        }
      });
      
      let query = supabase
        .from("expenses")
        .select(`
          *,
          categories (
            name
          )
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 sm:h-10 sm:w-10"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground">{dateRange.label}</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={dateRangeType}
            onValueChange={(value: 'monthly' | 'ytd' | 'ttm') => setDateRangeType(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="ttm">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRangeType === 'monthly' && (
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
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <ExpensesPieChart expenses={expenses} selectedMonth={selectedMonth} dateRange={dateRange} />
        
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