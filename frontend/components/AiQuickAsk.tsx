'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import { getApiUrl } from '@/lib/api';

export function AiQuickAsk() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isStreaming) return;

    setAnswer('');
    setIsStreaming(true);

    try {
      const baseUrl = await getApiUrl();
      const token = Cookies.get('finflow_token');

      const response = await fetch(`${baseUrl}/api/streaming/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) throw new Error('Erro ao conectar com a IA');

      // LEITURA DO STREAM MANUAL (NATIVO)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          setAnswer((prev) => prev + chunk);
        }
      }
    } catch (error) {
      setAnswer('⚠️ Desculpe, ocorreu um erro ao processar sua pergunta.');
      console.error(error);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          💬
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Pergunte à IA</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tire dúvidas rápidas sobre seus gastos este mês</p>
        </div>
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Qual categoria gastei mais? Como posso economizar R$ 200?"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 transition-all"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !question.trim()}
            className="absolute right-2 top-2 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isStreaming ? 'Pensando...' : 'Perguntar'}
          </button>
        </div>

        {answer && (
          <div className="mt-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {answer}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse" />}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
