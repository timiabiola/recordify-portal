import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt, ShoppingBag, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      console.log('Categories fetched:', data);
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses', selectedCategory],
    queryFn: async () => {
      console.log('Fetching expenses for category:', selectedCategory);
      let query = supabase
        .from('expenses')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }
      console.log('Expenses fetched:', data);
      return data;
    },
  });

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'essentials':
        return <Receipt className="w-4 h-4" />;
      case 'leisure':
        return <ShoppingBag className="w-4 h-4" />;
      case 'recurring_payments':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const formatCategoryName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const totalAmount = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Record
          </Link>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(category.name)}
                    {formatCategoryName(category.name)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Total Expenses: ${totalAmount.toFixed(2)}</span>
              {selectedCategory !== 'all' && categories?.find(c => c.id === selectedCategory) && (
                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                  {getCategoryIcon(categories.find(c => c.id === selectedCategory)?.name || '')}
                  {formatCategoryName(categories.find(c => c.id === selectedCategory)?.name || '')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {getCategoryIcon(expense.categories.name)}
                      {formatCategoryName(expense.categories.name)}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      ${Number(expense.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!expenses || expenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;