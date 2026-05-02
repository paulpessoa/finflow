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
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
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
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
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
                        className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                      >
                        {deleteMutation.isPending ? '...' : 'Excluir'}
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
