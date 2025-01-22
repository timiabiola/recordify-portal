import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type ExpenseData = {
  category: string;
  amount: number;
};

const COLORS = {
  essentials: '#8E9196',
  leisure: '#F97316',
  recurring_payments: '#0EA5E9'
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs sm:text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const ExpensesPieChart = ({ expenses, dateRange }: ExpensesPieChartProps) => {
  const isMobile = useIsMobile();

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base sm:text-lg">Expense Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] sm:h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Box className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm">No expenses found for this period</p>
            <p className="text-xs sm:text-sm">Add some expenses to see your distribution</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = expenses.reduce((acc: ExpenseData[], expense) => {
    const categoryName = expense.categories.name;
    const existingCategory = acc.find(item => item.category === categoryName);
    const amount = Number(expense.amount);
    
    if (existingCategory) {
      existingCategory.amount += amount;
    } else {
      acc.push({
        category: categoryName,
        amount: amount
      });
    }
    
    return acc;
  }, []);

  const totalExpenses = data.reduce((total, item) => total + item.amount, 0);

  return (
    <Card>
      <CardHeader className="space-y-1 p-3 sm:p-6">
        <CardTitle className="flex flex-col gap-1 sm:gap-2 text-base sm:text-lg">
          <span>Expense Distribution - {dateRange.label}</span>
          <span className="text-xs sm:text-sm font-normal text-muted-foreground">
            Total: ${totalExpenses.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 70 : 100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.category as keyof typeof COLORS]} 
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