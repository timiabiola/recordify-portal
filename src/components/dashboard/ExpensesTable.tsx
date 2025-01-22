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
  archived: boolean;
  categories: {
    name: string;
  };
};

type ExpensesTableProps = {
  expenses?: Expense[];
  showRestore?: boolean;
};

export const ExpensesTable = ({ expenses, showRestore }: ExpensesTableProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const deleteExpense = useDeleteExpense();

  const handleEdit = (expenseId: string) => {
    console.log('Navigating to edit expense:', expenseId);
    navigate(`/edit-expense/${expenseId}`);
  };

  const handleDelete = (expenseId: string) => {
    console.log('Deleting expense:', expenseId);
    deleteExpense.mutate({ id: expenseId, archive: true });
  };

  const handleRestore = (expenseId: string) => {
    console.log('Restoring expense:', expenseId);
    deleteExpense.mutate({ id: expenseId, archive: false });
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[#8E9196]">
              {isMobile ? 'Desc.' : 'Description'}
            </TableHead>
            {!isMobile && (
              <TableHead className="text-[#8E9196]">Category</TableHead>
            )}
            <TableHead className="text-right text-[#8E9196]">Amount</TableHead>
            <TableHead className="text-right text-[#8E9196]">
              {isMobile ? 'Date' : 'Created At'}
            </TableHead>
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
              onRestore={showRestore ? handleRestore : undefined}
            />
          ))}
          {(!expenses || expenses.length === 0) && (
            <TableRow>
              <TableCell 
                colSpan={isMobile ? 4 : 5} 
                className="text-center text-[#8E9196]"
              >
                No expenses found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};