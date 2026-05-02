import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      <h1 className="text-9xl font-black text-zinc-200 dark:text-zinc-800">404</h1>
      
      <div className="absolute space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Página não encontrada
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Ops! O caminho que você tentou acessar não existe ou foi movido.
        </p>
        
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
