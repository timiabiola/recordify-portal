import { ExpensesPieChart } from "./ExpensesPieChart";

type DashboardPieChartProps = {
  expenses: any[];
  selectedMonth: Date;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
};

export const DashboardPieChart = ({
  expenses,
  selectedMonth,
  dateRange,
}: DashboardPieChartProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <ExpensesPieChart 
        expenses={expenses} 
        selectedMonth={selectedMonth} 
        dateRange={dateRange} 
      />
    </div>
  );
};