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
import { ArrowLeft } from 'lucide-react';

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          categories (
            name
          )
        `);

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

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
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses: ${totalAmount.toFixed(2)}</CardTitle>
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
                    <TableCell>{expense.categories.name}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      ${Number(expense.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;