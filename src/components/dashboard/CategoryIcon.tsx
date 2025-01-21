import { Receipt, CreditCard, ShoppingBag } from 'lucide-react';

type CategoryIconProps = {
  categoryName: string;
  className?: string;
};

export const CategoryIcon = ({ categoryName, className = "w-4 h-4" }: CategoryIconProps) => {
  switch (categoryName) {
    case 'essentials':
      return <Receipt className={className} />;
    case 'monthly_recurring':
      return <CreditCard className={className} />;
    case 'leisure':
      return <ShoppingBag className={className} />;
    default:
      return <Receipt className={className} />;
  }
};