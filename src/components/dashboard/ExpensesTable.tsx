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

type Expense = {
  id: string;
  description: string;
  amount: number;
  categories: {
    name: string;
  };
};

type ExpensesTableProps = {
  expenses?: Expense[];
};

export const ExpensesTable = ({ expenses }: ExpensesTableProps) => {
  return (
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
              <CategoryIcon categoryName={expense.categories.name} />
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
  );
};