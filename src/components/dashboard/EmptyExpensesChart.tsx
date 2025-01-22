import { Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyExpensesChartProps = {
  dateRangeLabel: string;
};

export const EmptyExpensesChart = ({ dateRangeLabel }: EmptyExpensesChartProps) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base sm:text-lg">
          Expense Distribution - {dateRangeLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] sm:h-[300px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Box className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50" />
        <div className="text-center">
          <p className="text-sm">No expenses found for this period</p>
          <p className="text-xs sm:text-sm">Add some expenses to see your distribution</p>
        </div>
      </CardContent>
    </Card>
  );
};