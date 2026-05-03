'use client';

import { useTransactionSummary } from "@/hooks/useTransactions";
import { queryKeys } from "@/constants/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

import { CardSkeleton, Skeleton } from "@/components/Skeleton";
import { AiAdvisorPanel } from "@/components/AiAdvisorPanel";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading, isFetching } = useTransactionSummary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  };

  if (isLoading) return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );

  // Dados para o gráfico de pizza (Gastos por Categoria)
  const pieData = summary?.byCategory.map(cat => ({
    name: cat.name,
    value: Number(cat.total),
    color: cat.color
  })) || [];

  // Dados para o gráfico de barras (Entradas vs Saídas)
  const barData = [
    { name: 'Entradas', valor: summary?.income || 0, color: '#16a34a' },
    { name: 'Saídas', valor: summary?.expense || 0, color: '#dc2626' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Aqui está o resumo em tempo real do seu dinheiro.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isFetching ? 'Atualizando...' : 'Atualizar Dados'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Entradas</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(summary?.income || 0)}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Saídas</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(summary?.expense || 0)}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saldo Atual</p>
          <p className={`mt-2 text-3xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-zinc-900 dark:text-zinc-50' : 'text-red-600'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Painel da IA */}
      <AiAdvisorPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Barras - Comparativo */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-medium mb-6">Comparativo Mensal</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number | string | readonly (number | string)[] | undefined) => value ? formatCurrency(Number(value)) : ''}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />

                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-medium mb-6">Distribuição de Gastos</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number | string | readonly (number | string)[] | undefined) => value ? formatCurrency(Number(value)) : ''}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />

                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Categorias com Barras */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-medium">Detalhamento por Categoria</h3>
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
