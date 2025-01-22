import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useDeleteExpense } from "@/hooks/use-delete-expense";
import { ExpenseRow } from "./ExpenseRow";

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
  const deleteExpense = useDeleteExpense();

  const handleEdit = (expenseId: string) => {
    console.log('Navigating to edit expense:', expenseId);
    navigate(`/edit-expense/${expenseId}`);
  };

  const handleDelete = (expenseId: string) => {
    console.log('Deleting expense:', expenseId);
    deleteExpense.mutate(expenseId);
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
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses?.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              isMobile={isMobile}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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