'use client';

import { useHealthCheck } from '@/hooks/useHealthCheck';

export function ApiStatusBadge() {
  const { data, isLoading, isError, isFetching } = useHealthCheck();

  // Caso esteja carregando pela primeira vez ou buscando no fundo enquanto está em erro
  const isWakingUp = isLoading || (isFetching && isError);

  if (isError && !isFetching) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-500"></span>
        Servidor Offline
      </div>
    );
  }

  if (isWakingUp) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
        Backend acordando...
      </div>
    );
  }

  if (data?.status === 'ok' || data?.status === 'healthy') {
    return (
      <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        Conectado
      </div>
    );
  }

  return null;
}
