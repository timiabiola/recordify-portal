import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "./CategoryIcon";
import { formatCategoryName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type Category = {
  id: string;
  name: string;
};

type CategorySelectProps = {
  selectedCategory: string;
  categories?: Category[];
  onCategoryChange: (value: string) => void;
  showAllOption?: boolean;
};

export const CategorySelect = ({
  selectedCategory,
  categories,
  onCategoryChange,
  showAllOption = false,
}: CategorySelectProps) => {
  const isMobile = useIsMobile();

  if (!categories) {
    return (
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all" className="flex items-center gap-2">
            <span>All Categories</span>
          </SelectItem>
        )}
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              <CategoryIcon categoryName={category.name} />
              {formatCategoryName(category.name)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};