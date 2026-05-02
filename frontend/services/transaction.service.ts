import { apiFetch } from "@/lib/api";
import { PaginatedResponse, Transaction, TransactionSummary } from "@shared/types";

export const transactionService = {
  async getAll(page = 1, limit = 10) {
    return apiFetch<PaginatedResponse<Transaction>>(`/api/transactions?page=${page}&limit=${limit}`);
  },

  async getSummary() {
    return apiFetch<TransactionSummary>('/api/transactions/summary');
  },

  async create(data: Partial<Transaction>) {
    return apiFetch<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }
};
