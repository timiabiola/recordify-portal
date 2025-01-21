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
};

export const CategorySelect = ({
  selectedCategory,
  categories,
  onCategoryChange,
}: CategorySelectProps) => {
  const isMobile = useIsMobile();

  return (
    <Select value={selectedCategory} onValueChange={onCategoryChange}>
      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
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