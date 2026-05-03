'use client';

import { useAiInsights } from '@/hooks/useAiInsights';
import { Skeleton } from '@/components/Skeleton';

export function AiAdvisorPanel() {
  const { data, isLoading, isError, error, isFetching, refetch } = useAiInsights();

  const handleAnalyze = () => {
    refetch();
  };

  const handleRefresh = () => {
    // Força a re-chamada à API ignorando o cache do React Query
    refetch();
  };

  // Estado Inicial: Botão para disparar a análise
  if (!data && !isLoading && !isFetching && !isError) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/30 dark:bg-indigo-900/10 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 mb-4 text-xl">
          ✨
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Consultor FinFlow IA</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
          Descubra para onde seu dinheiro está indo. Nossa IA analisa seus hábitos dos últimos 30 dias e cria um plano de ação personalizado.
        </p>
        <button
          onClick={handleAnalyze}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Gerar Análise Financeira
        </button>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Consultor IA indisponível</h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          {error instanceof Error ? error.message : 'Ocorreu um erro ao carregar os insights.'}
        </p>
        <button 
          onClick={handleAnalyze}
          className="mt-4 text-sm font-medium text-red-700 hover:text-red-800 underline dark:text-red-400 cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const ratingColors = {
    Saudável: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Alerta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Crítico: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 relative overflow-hidden flex flex-col">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10"></div>
      
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Consultor FinFlow IA</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${ratingColors[data.rating]}`}>
                {data.rating}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Análise baseada nos últimos 30 dias</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 relative mb-2">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider">Insights Principais</h4>
          <ul className="space-y-3">
            {data.insights.map((insight, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">●</span> 
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wider">Plano de Ação Semanal</h4>
          <div className="space-y-3">
            {data.actionPlan.map((action, i) => (
              <label key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">{action}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer com o Botão Reanalisar */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 relative z-10">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
          * Para economizar recursos de API e evitar repetições, a análise fica salva em cache por 5 minutos. 
          Use o botão ao lado se quiser forçar uma leitura atualizada do banco.
        </p>
        <button 
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isFetching ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Analisando...
            </span>
          ) : 'Forçar Reanálise'}
        </button>
      </div>
    </div>
  );
}
