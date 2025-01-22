import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth } from 'date-fns';

type ExpenseData = {
  category: string;
  amount: number;
};

const COLORS = {
  essentials: '#8E9196',      // Neutral Gray
  leisure: '#F97316',         // Bright Orange
  recurring_payments: '#0EA5E9' // Ocean Blue
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
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type ExpensesPieChartProps = {
  expenses?: {
    categories: {
      name: string;
    };
    amount: number;
    created_at: string;
  }[];
};

export const ExpensesPieChart = ({ expenses }: ExpensesPieChartProps) => {
  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No expenses found for this month
        </CardContent>
      </Card>
    );
  }

  // Filter expenses for the current month
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.created_at);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  // Process data for the pie chart
  const data = currentMonthExpenses.reduce((acc: ExpenseData[], expense) => {
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

  console.log('[ExpensesPieChart] Current month data:', data);

  // Calculate total monthly expenses
  const totalMonthlyExpenses = data.reduce((total, item) => total + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-2">
          <span>Monthly Expense Distribution</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: ${totalMonthlyExpenses.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
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
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};