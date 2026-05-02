import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";
import { queryKeys } from "@/constants/queryKeys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAll(),
  });
}
