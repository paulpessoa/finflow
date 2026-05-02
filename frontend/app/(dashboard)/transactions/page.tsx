'use client';

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: Category;
}

interface TransactionResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await apiFetch<TransactionResponse>('/api/transactions');
        setTransactions(response.data); // O array real está em .data
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) return <div>Carregando transações...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Transações</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gerencie seu histórico financeiro detalhadamente.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          Nova Transação
        </button>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
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
