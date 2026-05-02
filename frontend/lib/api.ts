import Cookies from 'js-cookie';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  const token = Cookies.get('finflow_token');

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(errorData.message || `Erro na requisição: ${res.status}`);
  }

  return res.json();
}
