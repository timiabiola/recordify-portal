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
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <ExpensesPieChart 
          expenses={expenses} 
          selectedMonth={selectedMonth} 
          dateRange={dateRange} 
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
          <div className="w-full sm:w-auto">
            <CategorySelect
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={onCategoryChange}
              showAllOption={true}
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <ExpensesTable expenses={expenses} />
          </div>
        </div>
      </div>
    </div>
  );
};