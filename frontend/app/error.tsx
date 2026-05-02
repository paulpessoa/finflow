"use client"

export default function Error({
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-zinc-900">Algo deu errado!</h2>
        <p className="text-zinc-600">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Tentar novamente
          </button>

          <a
            href="/dashboard"
            className="rounded-md bg-zinc-200 px-6 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  )
}
