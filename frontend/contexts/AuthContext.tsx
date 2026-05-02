'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Tenta recuperar o token e o usuário do localStorage ao iniciar
    const token = localStorage.getItem('finflow_token');
    const storedUser = localStorage.getItem('finflow_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  async function signIn({ email, password }: any) {
    try {
      const response = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('finflow_token', response.token);
      localStorage.setItem('finflow_user', JSON.stringify(response.user));

      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  function signOut() {
    localStorage.removeItem('finflow_token');
    localStorage.removeItem('finflow_user');
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
