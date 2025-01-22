import { CardHeader, CardTitle } from "@/components/ui/card";

type PieChartHeaderProps = {
  dateRangeLabel: string;
  totalExpenses: number;
};

export const PieChartHeader = ({ dateRangeLabel, totalExpenses }: PieChartHeaderProps) => {
  return (
    <CardHeader className="space-y-1 p-3 sm:p-6">
      <CardTitle className="flex flex-col gap-1 sm:gap-2 text-base sm:text-lg">
        <span>Expense Distribution - {dateRangeLabel}</span>
        <span className="text-xs sm:text-sm font-normal text-muted-foreground">
          Total: ${totalExpenses.toFixed(2)}
        </span>
      </CardTitle>
    </CardHeader>
  );
};