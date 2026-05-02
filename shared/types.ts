export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number | string;
  type: TransactionType;
  date: string;
  notes?: string | null;
  userId: string;
  categoryId: string;
  category: Category;
  user?: User;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    id: string;
    name: string;
    color: string;
    icon: string;
    total: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
