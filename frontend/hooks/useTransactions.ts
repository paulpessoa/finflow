import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/services/transaction.service";
import { queryKeys } from "@/constants/queryKeys";
import { Transaction } from "@shared/types";

export function useTransactions(page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.transactions.list(page, limit),
    queryFn: () => transactionService.getAll(page, limit),
  });
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: queryKeys.transactions.summary,
    queryFn: () => transactionService.getSummary(),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Transaction>) => transactionService.create(data),
    onSuccess: () => {
      // Invalida tudo que começa com 'transactions' (lista, summary, etc)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => 
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
