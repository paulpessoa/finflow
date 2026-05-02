"use client"

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, signOut, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar/Header */}
      <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-indigo-600">FinFlow</h1>
            <div className="hidden space-x-4 md:flex">
              <a
                href="/dashboard"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Dashboard
              </a>
              <a
                href="/transactions"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Transações
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Olá, {user?.name}
            </span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
    </div>
  )
}
