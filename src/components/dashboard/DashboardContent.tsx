import { ExpensesPieChart } from "./ExpensesPieChart";
import { ExpensesTable } from "./ExpensesTable";
import { CategorySelect } from "./CategorySelect";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Download, Archive } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

type DashboardContentProps = {
  expenses?: any[];
  categories?: any[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedMonth: Date;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
};

export const DashboardContent = ({
  expenses,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedMonth,
  dateRange,
}: DashboardContentProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);

  const activeExpenses = expenses?.filter(expense => !expense.archived) || [];
  const archivedExpenses = expenses?.filter(expense => expense.archived) || [];

  const handleExport = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "Add some expenses first before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Description", "Category", "Amount", "Created At"];
    const rows = expenses.map((expense) => [
      expense.description,
      expense.categories.name,
      `$${Number(expense.amount).toFixed(2)}`,
      format(new Date(expense.created_at), "MM/dd/yyyy HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Your expenses have been exported to CSV.",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <ExpensesPieChart 
          expenses={activeExpenses} 
          selectedMonth={selectedMonth} 
          dateRange={dateRange} 
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Expenses</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="w-9 h-9"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full sm:w-auto">
            <CategorySelect
              selectedCategory={selectedCategory}
              categories={categories}
              onCategoryChange={onCategoryChange}
              showAllOption={true}
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <ExpensesTable expenses={activeExpenses} />
          </div>
        </div>
      </div>

      {archivedExpenses.length > 0 && (
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
                <ExpensesTable expenses={archivedExpenses} showRestore />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};