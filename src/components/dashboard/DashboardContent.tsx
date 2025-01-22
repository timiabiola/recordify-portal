import { DashboardPieChart } from "./DashboardPieChart";
import { ActiveExpenses } from "./ActiveExpenses";
import { ArchivedExpenses } from "./ArchivedExpenses";

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
  const activeExpenses = expenses?.filter(expense => !expense.archived) || [];
  const archivedExpenses = expenses?.filter(expense => expense.archived) || [];

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <DashboardPieChart 
        expenses={activeExpenses} 
        selectedMonth={selectedMonth} 
        dateRange={dateRange} 
      />
      
      <ActiveExpenses
        expenses={activeExpenses}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />

      <ArchivedExpenses expenses={archivedExpenses} />
    </div>
  );
};