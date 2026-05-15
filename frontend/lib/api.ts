import Cookies from "js-cookie"

export type ApiProvider = "node" | "go" | "python"
const PROVIDER_COOKIE_KEY = "finflow_api_provider"
const TOKEN_COOKIE_KEY = "finflow_token"

/**
 * Retorna o provedor de API atual (node, go ou python).
 * Funciona tanto no Client quanto no Server.
 */
export async function getApiProvider(): Promise<ApiProvider> {
  if (typeof window === "undefined") {
    // Lado do Servidor (Next.js)
    try {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      return (cookieStore.get(PROVIDER_COOKIE_KEY)?.value ||
        "node") as ApiProvider
    } catch (e) {
      return "node"
    }
  }
  // Lado do Cliente
  return (Cookies.get(PROVIDER_COOKIE_KEY) || "node") as ApiProvider
}

/**
 * Define o provedor de API e salva no Cookie.
 */
export function setApiProvider(provider: ApiProvider) {
  if (typeof window !== "undefined") {
    Cookies.set(PROVIDER_COOKIE_KEY, provider, { expires: 365 })
  }
}

/**
 * Retorna a URL base dinamicamente com base no provedor selecionado.
 */
export async function getApiUrl(): Promise<string> {
  const provider = await getApiProvider();
  if (provider === 'go') {
    return process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:3002";
  }
  if (provider === 'python') {
    return process.env.NEXT_PUBLIC_PYTHON_API_URL || "https://paulpessoa-finflow-python.hf.space";
  }
  // Fallback para a variável antiga caso o usuário não tenha migrado o .env
  return process.env.NEXT_PUBLIC_NODE_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

/**
 * Função universal para chamadas de API.
 * Gerencia tokens e baseUrl automaticamente.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = await getApiUrl()
  let token: string | undefined

  if (typeof window === "undefined") {
    // Lado do Servidor
    try {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      token = cookieStore.get(TOKEN_COOKIE_KEY)?.value
    } catch (e) {
      token = undefined
    }
  } else {
    // Lado do Cliente
    token = Cookies.get(TOKEN_COOKIE_KEY)
  }

  // Debug warn para facilitar identificação de problemas de token
  if (
    !token &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  ) {
    console.warn(`[apiFetch] Token não encontrado para a rota: ${path}.`)
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  })

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Erro desconhecido" }))
    throw new Error(
      errorData.error ||
        errorData.message ||
        `Erro na requisição: ${res.status}`
    )
  }

  return res.json()
}
