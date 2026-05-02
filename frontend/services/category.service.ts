import { apiFetch } from "@/lib/api";
import { Category } from "@shared/types";

export const categoryService = {
  async getAll() {
    return apiFetch<Category[]>('/api/categories');
  }
};
