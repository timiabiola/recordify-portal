import { ShoppingBag, Clock, DollarSign } from 'lucide-react';
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
      return 'Essential expenses needed for life: housing, utilities, groceries, transportation';
    case 'leisure':
      return 'Discretionary spending for pleasure and entertainment';
    case 'recurring_payments':
      return 'Subscription services, memberships, and regular bills';
    default:
      return '';
  }
};

export const CategoryIcon = ({ categoryName, className = "w-4 h-4", showTooltip = true }: CategoryIconProps) => {
  const icon = (() => {
    switch (categoryName) {
      case 'essentials':
        return <ShoppingBag className={className} />;
      case 'recurring_payments':
        return <Clock className={className} />;
      case 'leisure':
        return <DollarSign className={className} />;
      default:
        return <ShoppingBag className={className} />;
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