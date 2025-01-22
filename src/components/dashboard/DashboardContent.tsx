import { ExpensesPieChart } from "./ExpensesPieChart";
import { ExpensesTable } from "./ExpensesTable";
import { CategorySelect } from "./CategorySelect";
import { useIsMobile } from "@/hooks/use-mobile";

type DashboardContentProps = {
  expenses?: any[];
  categories?: any[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedMonth: Date;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
};

export const DashboardContent = ({
  expenses,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedMonth,
  dateRange,
}: DashboardContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 sm:space-y-6">
      <ExpensesPieChart 
        expenses={expenses} 
        selectedMonth={selectedMonth} 
        dateRange={dateRange} 
      />
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
          <CategorySelect
            selectedCategory={selectedCategory}
            categories={categories}
            onCategoryChange={onCategoryChange}
            showAllOption={true}
          />
        </div>
        <ExpensesTable expenses={expenses} />
      </div>
    </div>
  );
};