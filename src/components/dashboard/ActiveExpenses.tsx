import { ExpensesTable } from "./ExpensesTable";
import { CategorySelect } from "./CategorySelect";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type ActiveExpensesProps = {
  expenses: any[];
  categories?: any[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
};

export const ActiveExpenses = ({
  expenses,
  categories,
  selectedCategory,
  onCategoryChange,
}: ActiveExpensesProps) => {
  const { toast } = useToast();

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
          <ExpensesTable expenses={expenses} />
        </div>
      </div>
    </div>
  );
};