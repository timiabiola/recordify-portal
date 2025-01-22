import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";

type DateRangeSelectProps = {
  dateRangeType: 'monthly' | 'ytd' | 'ttm';
  selectedMonth: Date;
  onDateRangeTypeChange: (value: 'monthly' | 'ytd' | 'ttm') => void;
  onMonthChange: (value: string) => void;
};

export const DateRangeSelect = ({
  dateRangeType,
  selectedMonth,
  onDateRangeTypeChange,
  onMonthChange,
}: DateRangeSelectProps) => {
  // Generate last 12 months for the dropdown
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });

  return (
    <div className="flex gap-2">
      <Select
        value={dateRangeType}
        onValueChange={onDateRangeTypeChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            {dateRangeType === 'monthly' ? 'Monthly' : 
             dateRangeType === 'ytd' ? 'Year to Date' : 
             'Last 12 Months'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="ytd">Year to Date</SelectItem>
          <SelectItem value="ttm">Last 12 Months</SelectItem>
        </SelectContent>
      </Select>
      
      {dateRangeType === 'monthly' && (
        <Select
          value={selectedMonth.toISOString()}
          onValueChange={onMonthChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {format(selectedMonth, 'MMMM yyyy')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {last12Months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};