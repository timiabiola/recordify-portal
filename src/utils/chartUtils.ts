export const calculatePieChartData = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) return [];

  return expenses.reduce((acc: { category: string; amount: number; }[], expense) => {
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
};

export const CHART_COLORS = {
  essentials: '#8E9196',
  leisure: '#F97316',
  recurring_payments: '#0EA5E9'
} as const;

export const calculateTotalExpenses = (data: { amount: number }[]) => {
  return data.reduce((total, item) => total + item.amount, 0);
};