'use client';

import { useState, useEffect } from 'react';
import { getApiProvider, setApiProvider, ApiProvider } from '@/lib/apiConfig';

export function ApiSelector() {
  const [provider, setProvider] = useState<ApiProvider>('node');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProvider(getApiProvider());
    setMounted(true);
  }, []);

  const handleToggle = (newProvider: ApiProvider) => {
    setApiProvider(newProvider);
    setProvider(newProvider);
    // Recarrega a página para garantir que todas as instâncias do TanStack Query
    // e o estado da aplicação usem a nova URL base
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => handleToggle('node')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          provider === 'node'
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        Node.js
      </button>
      <button
        onClick={() => handleToggle('go')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          provider === 'go'
            ? 'bg-indigo-500 text-white shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        Golang
      </button>
    </div>
  );
}
