import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DateRangeSelect } from "./DateRangeSelect";

type DashboardHeaderProps = {
  onBackClick: () => void;
  dateRangeType: 'monthly' | 'ytd' | 'ttm';
  selectedMonth: Date;
  onDateRangeTypeChange: (value: 'monthly' | 'ytd' | 'ttm') => void;
  onMonthChange: (value: string) => void;
  dateRangeLabel: string;
};

export const DashboardHeader = ({
  onBackClick,
  dateRangeType,
  selectedMonth,
  onDateRangeTypeChange,
  onMonthChange,
  dateRangeLabel,
}: DashboardHeaderProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 sm:h-10 sm:w-10"
        onClick={onBackClick}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Monthly Budget</h1>
        <p className="text-muted-foreground">{dateRangeLabel}</p>
      </div>
      <DateRangeSelect
        dateRangeType={dateRangeType}
        selectedMonth={selectedMonth}
        onDateRangeTypeChange={onDateRangeTypeChange}
        onMonthChange={onMonthChange}
      />
    </div>
  );
};