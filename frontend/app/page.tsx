export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4">
      <main className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            FinFlow
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Sua jornada para a liberdade financeira começa aqui.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="/login"
            className="w-full flex items-center justify-center h-12 px-6 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Entrar no sistema
          </a>
          <p className="text-sm text-zinc-500">
            Ainda não tem conta?{" "}
            <a href="/register" className="text-indigo-600 hover:underline">
              Cadastre-se
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
