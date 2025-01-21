import { Receipt, ShoppingBag, CreditCard } from 'lucide-react';

type CategoryIconProps = {
  categoryName: string;
  className?: string;
};

export const CategoryIcon = ({ categoryName, className = "w-4 h-4" }: CategoryIconProps) => {
  switch (categoryName) {
    case 'essentials':
      return <Receipt className={className} />;
    case 'leisure':
      return <ShoppingBag className={className} />;
    case 'recurring_payments':
      return <CreditCard className={className} />;
    default:
      return <Receipt className={className} />;
  }
};