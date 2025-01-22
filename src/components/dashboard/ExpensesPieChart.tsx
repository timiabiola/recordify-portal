import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChartLabel } from "./PieChartLabel";
import { EmptyExpensesChart } from "./EmptyExpensesChart";
import { PieChartHeader } from "./PieChartHeader";
import { calculatePieChartData, CHART_COLORS, calculateTotalExpenses } from "@/utils/chartUtils";

type ExpensesPieChartProps = {
  expenses: any[];
  selectedMonth: Date;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
};

export const ExpensesPieChart = ({ expenses, dateRange }: ExpensesPieChartProps) => {
  const isMobile = useIsMobile();

  if (!expenses || expenses.length === 0) {
    return <EmptyExpensesChart dateRangeLabel={dateRange.label} />;
  }

  const data = calculatePieChartData(expenses);
  const totalExpenses = calculateTotalExpenses(data);
  const renderLabel = (props: any) => <PieChartLabel {...props} isMobile={isMobile} />;

  return (
    <Card>
      <PieChartHeader 
        dateRangeLabel={dateRange.label}
        totalExpenses={totalExpenses}
      />
      <CardContent className="p-3 sm:p-6">
        <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={isMobile ? 70 : 100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[entry.category as keyof typeof CHART_COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(category) => {
                  return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
                }}
              />
              <Legend 
                formatter={(value) => {
                  return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                }}
                wrapperStyle={isMobile ? { fontSize: '12px' } : undefined}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};