import { TableCell, TableRow } from "@/components/ui/table";
import { CategoryIcon } from "./CategoryIcon";
import { formatCategoryName } from "@/lib/utils";
import { format } from "date-fns";
import { ExpenseActions } from "./ExpenseActions";

type ExpenseRowProps = {
  expense: {
    id: string;
    description: string;
    amount: number;
    created_at: string;
    categories: {
      name: string;
    };
  };
  isMobile: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ExpenseRow = ({ expense, isMobile, onEdit, onDelete }: ExpenseRowProps) => {
  const formatDescription = (description: string) => {
    return description.charAt(0).toUpperCase() + 
           description.slice(1).trim().split(/\s+/).slice(0, 2).join(' ');
  };

  return (
    <TableRow>
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
        <ExpenseActions
          expenseId={expense.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};