import { ExpensesTable } from "./ExpensesTable";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useState } from "react";

type ArchivedExpensesProps = {
  expenses: any[];
};

export const ArchivedExpenses = ({ expenses }: ArchivedExpensesProps) => {
  const [showArchived, setShowArchived] = useState(false);

  if (expenses.length === 0) return null;

  return (
    <div className="bg-white/50 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-muted-foreground">Archived Expenses</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? "Hide" : "Show"}
        </Button>
      </div>
      
      {showArchived && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <ExpensesTable expenses={expenses} showRestore />
          </div>
        </div>
      )}
    </div>
  );
};