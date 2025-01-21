import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CategorySelect } from '@/components/dashboard/CategorySelect';
import { ExpensesTable } from '@/components/dashboard/ExpensesTable';
import { formatCategoryName } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

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

  const totalAmount = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Record
          </Link>
          
          <CategorySelect 
            selectedCategory={selectedCategory}
            categories={categories}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
              <span className="text-xl sm:text-2xl">
                {selectedCategory === 'all' 
                  ? `Total Expenses: $${totalAmount.toFixed(2)}`
                  : `${formatCategoryName(categories?.find(c => c.id === selectedCategory)?.name || '')} Expenses: $${totalAmount.toFixed(2)}`}
              </span>
              {selectedCategory !== 'all' && categories?.find(c => c.id === selectedCategory) && (
                <span className="text-muted-foreground text-sm">
                  {formatCategoryName(categories.find(c => c.id === selectedCategory)?.name || '')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <ExpensesTable expenses={expenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;