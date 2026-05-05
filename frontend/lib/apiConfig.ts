import Cookies from "js-cookie"

export type ApiProvider = "node" | "go"

const COOKIE_KEY = "finflow_api_provider"

// Configuração centralizada das URLs
// Em produção, o Render fornece as URLs via variáveis de ambiente
const getUrls = (): Record<ApiProvider, string> => ({
  node: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  go: process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:3002"
})

export function getApiUrl(): string {
  const urls = getUrls()
  const provider = (Cookies.get(COOKIE_KEY) ?? "node") as ApiProvider
  return urls[provider] ?? urls.node
}

export function setApiProvider(provider: ApiProvider) {
  Cookies.set(COOKIE_KEY, provider, { expires: 365 })
}

export function getApiProvider(): ApiProvider {
  return (Cookies.get(COOKIE_KEY) ?? "node") as ApiProvider
}
