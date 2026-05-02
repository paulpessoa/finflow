'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Carrega os Devtools apenas no lado do cliente, de forma dinâmica
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
  { ssr: false }
);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos de cache "fresco"
        retry: 1, // Tenta apenas uma vez em caso de erro
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* O componente dinâmico já cuida para não rodar no servidor */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
