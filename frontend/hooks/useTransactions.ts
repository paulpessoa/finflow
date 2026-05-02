import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/services/transaction.service";

export function useTransactions(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: () => transactionService.getAll(page, limit),
  });
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: () => transactionService.getSummary(),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      // Invalida tanto a lista quanto o resumo para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
