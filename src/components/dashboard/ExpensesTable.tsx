import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryIcon } from "./CategoryIcon";
import { formatCategoryName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Expense = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  categories: {
    name: string;
  };
};

type ExpensesTableProps = {
  expenses?: Expense[];
};

export const ExpensesTable = ({ expenses }: ExpensesTableProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleEdit = (expenseId: string) => {
    console.log('Navigating to edit expense:', expenseId);
    navigate(`/edit-expense/${expenseId}`);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatDescription = (description: string) => {
    return capitalizeFirstLetter(
      description.trim().split(/\s+/).slice(0, 2).join(' ')
    );
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isMobile ? 'Desc.' : 'Description'}</TableHead>
            {!isMobile && <TableHead>Category</TableHead>}
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">{isMobile ? 'Date' : 'Created At'}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses?.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {isMobile && <CategoryIcon categoryName={expense.categories.name} />}
                  <span className="truncate max-w-[150px] sm:max-w-none">
                    {formatDescription(expense.description)}
                  </span>
                </div>
              </TableCell>
              {!isMobile && (
                <TableCell className="flex items-center gap-2">
                  <CategoryIcon categoryName={expense.categories.name} />
                  {formatCategoryName(expense.categories.name)}
                </TableCell>
              )}
              <TableCell className="text-right text-destructive font-medium">
                ${Number(expense.amount).toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(new Date(expense.created_at), isMobile ? 'MM/dd/yy' : 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(expense.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!expenses || expenses.length === 0) && (
            <TableRow>
              <TableCell colSpan={isMobile ? 4 : 5} className="text-center text-muted-foreground">
                No expenses found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};