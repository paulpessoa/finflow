'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@shared/types';
import { useLogin } from '@/hooks/useAuthHooks';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (credentials: Record<'email' | 'password', string>) => Promise<void>;
  signOut: () => void;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('finflow_token');
    const storedUser = localStorage.getItem('finflow_user');

    if (token && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const router = useRouter();
  const loginMutation = useLogin();

  const isAuthenticated = !!user;

  async function signIn(credentials: Record<'email' | 'password', string>) {
    try {
      const response = await loginMutation.mutateAsync(credentials);

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
    loginMutation.reset();
    
    // Força um reset total da aplicação para garantir que o cache em memória (TanStack Query) seja destruído
    router.push('/login');
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      signIn, 
      signOut, 
      isLoggingIn: loginMutation.isPending 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
