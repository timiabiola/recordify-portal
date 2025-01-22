import { Receipt, Clock, Coffee } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CategoryIconProps = {
  categoryName: string;
  className?: string;
  showTooltip?: boolean;
};

const getCategoryDescription = (categoryName: string) => {
  switch (categoryName) {
    case 'essentials':
      return 'Essential expenses needed for life in North America: housing, utilities, groceries, car payments, etc.';
    case 'leisure':
      return 'Discretionary spending for pleasure and entertainment - consumption rather than investment';
    case 'recurring_payments':
      return 'Subscription-based expenses outside of regular essential bills to track recurring payment commitments';
    default:
      return '';
  }
};

export const CategoryIcon = ({ categoryName, className = "w-4 h-4", showTooltip = true }: CategoryIconProps) => {
  const icon = (() => {
    switch (categoryName) {
      case 'essentials':
        return <Receipt className={className} />;
      case 'recurring_payments':
        return <Clock className={className} />;
      case 'leisure':
        return <Coffee className={className} />;
      default:
        return <Receipt className={className} />;
    }
  })();

  if (!showTooltip) return icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{getCategoryDescription(categoryName)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};