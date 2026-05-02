'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui você poderia logar o erro em um serviço como Sentry ou LogRocket
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      <div className="space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Algo deu errado!
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ocorreu um erro inesperado ao carregar esta página. Nossa equipe já foi notificada.
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-800 px-6 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}
