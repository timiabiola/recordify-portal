import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ExpenseActions } from "./ExpenseActions";
import { CategoryIcon } from "./CategoryIcon";

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
  onRestore?: (id: string) => void;
};

export const ExpenseRow = ({ expense, isMobile, onEdit, onDelete, onRestore }: ExpenseRowProps) => {
  return (
    <TableRow key={expense.id}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <CategoryIcon categoryName={expense.categories.name} />
          <span className="truncate max-w-[200px] capitalize text-[#7E69AB]">
            {expense.description}
          </span>
          {isMobile && (
            <span className="text-xs text-[#7E69AB] capitalize">
              {expense.categories.name}
            </span>
          )}
        </div>
      </TableCell>
      {!isMobile && (
        <TableCell className="text-[#7E69AB] capitalize">
          {expense.categories.name}
        </TableCell>
      )}
      <TableCell className="text-right font-semibold text-[#ea384c]">
        ${Number(expense.amount).toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-[#7E69AB]">
        {format(new Date(expense.created_at), isMobile ? "MM/dd" : "MM/dd/yyyy")}
      </TableCell>
      <TableCell>
        <ExpenseActions
          expenseId={expense.id}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
        />
      </TableCell>
    </TableRow>
  );
};