"use client"

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, signOut, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

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
      <nav className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8 w-1/3">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-600 transition-colors hover:text-indigo-500">
              FinFlow
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-center space-x-8">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/transactions"
              className={`text-sm font-medium transition-colors ${
                pathname === "/transactions"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Transações
            </Link>
          </div>

          <div className="flex items-center justify-end gap-4 w-1/3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Olá, {user?.name}
            </span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer"
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

