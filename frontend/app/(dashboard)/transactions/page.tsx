'use client';

import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { useState } from "react";
import { TransactionModal } from "@/components/TransactionModal";
import { Transaction } from "@shared/types";

import { TableRowSkeleton } from "@/components/Skeleton";

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { data: response, isLoading } = useTransactions();
  const deleteMutation = useDeleteTransaction();

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleCreateNew = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        alert('Erro ao excluir transação.');
      }
    }
  };

  const transactions = response?.data || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Transações</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gerencie seu histórico financeiro detalhadamente.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm"
        >
          Nova Transação
        </button>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={selectedTransaction}
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</th>
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</th>
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</th>
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo</th>
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 text-right">Valor</th>
                <th className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={`skeleton-${i}`} />
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span 
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ 
                          backgroundColor: `${transaction.category.color}15`, 
                          color: transaction.category.color 
                        }}
                      >
                        {transaction.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        transaction.type === 'INCOME' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-3">
                      <button 
                        onClick={() => handleEdit(transaction)}
                        title="Editar"
                        className="text-zinc-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteMutation.isPending}
                        title="Excluir"
                        className="text-zinc-400 hover:text-red-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {deleteMutation.isPending ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}