'use client';

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { TransactionSummary } from "@shared/types";

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // O useQuery substitui o useEffect e o useState!
  const { data: summary, isLoading, isFetching } = useQuery({
    queryKey: ['summary'],
    queryFn: () => apiFetch<TransactionSummary>('/api/transactions/summary'),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para invalidar o cache e forçar um novo fetch
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['summary'] });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      <span className="ml-3 text-zinc-600">Calculando finanças...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Aqui está o resumo em tempo real do seu dinheiro.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all"
        >
          {isFetching ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card Entradas */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Entradas</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(summary?.income || 0)}
          </p>
        </div>

        {/* Card Saídas */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Saídas</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(summary?.expense || 0)}
          </p>
        </div>

        {/* Card Saldo */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saldo Atual</p>
          <p className={`mt-2 text-3xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-zinc-900 dark:text-zinc-50' : 'text-red-600'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Seção de Categorias */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-medium">Gastos por Categoria</h3>
        <div className="mt-6 space-y-4">
          {summary?.byCategory.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <div className="mt-1 h-1.5 w-48 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div 
                      className="h-1.5 rounded-full" 
                      style={{ 
                        backgroundColor: cat.color,
                        width: `${Math.min((cat.total / (summary.expense || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(cat.total)}</p>
            </div>
          ))}
          {(!summary?.byCategory || summary.byCategory.length === 0) && (
            <p className="text-center text-sm text-zinc-500 py-4">Nenhum gasto registrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
