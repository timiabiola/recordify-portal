import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DateRangeSelect } from "./DateRangeSelect";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={onBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Monthly Budget</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{dateRangeLabel}</p>
          </div>
        </div>
        <div className="sm:ml-auto w-full sm:w-auto">
          <DateRangeSelect
            dateRangeType={dateRangeType}
            selectedMonth={selectedMonth}
            onDateRangeTypeChange={onDateRangeTypeChange}
            onMonthChange={onMonthChange}
          />
        </div>
      </div>
    </div>
  );
};