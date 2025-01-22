import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dateRangeType, setDateRangeType] = useState<'monthly' | 'ytd' | 'ttm'>('monthly');

  // Calculate date ranges based on selected type
  const getDateRange = () => {
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
    if (dateRangeType !== 'monthly' || selectedCategory !== 'all') {
      setDateRangeType('monthly');
      setSelectedMonth(new Date());
      setSelectedCategory('all');
    } else {
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
    <div className="min-h-screen bg-gray-50">
      <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6 px-0 sm:px-6">
        <DashboardHeader
          onBackClick={handleBackClick}
          dateRangeType={dateRangeType}
          selectedMonth={selectedMonth}
          onDateRangeTypeChange={setDateRangeType}
          onMonthChange={(value) => setSelectedMonth(new Date(value))}
          dateRangeLabel={dateRange.label}
        />
        <DashboardContent
          expenses={expenses}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedMonth={selectedMonth}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
};

export default Dashboard;