import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryProvider } from "@/contexts/QueryProvider"
import { cookies } from "next/headers"
import { User } from "@shared/types"
import { SocialLinks } from "@/components/SocialLinks"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "FinFlow - Controle sua vida financeira",
  description:
    "Dashboard de finanças pessoais para controle de receitas e despesas."
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // Lê o cookie no Servidor
  const cookieStore = await cookies()
  const userCookie = cookieStore.get("finflow_user")
  let initialUser: User | null = null

  if (userCookie) {
    try {
      initialUser = JSON.parse(userCookie.value)
    } catch {
      initialUser = null
    }
  }

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <QueryProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
            <SocialLinks />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
