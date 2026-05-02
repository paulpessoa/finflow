'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@shared/types';
import { useLogin } from '@/hooks/useAuthHooks';
import Cookies from 'js-cookie';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (credentials: Record<'email' | 'password', string>) => Promise<void>;
  setAuthenticatedUser: (userData: User, token: string) => void;
  signOut: () => void;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ 
  children, 
  initialUser = null 
}: { 
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const router = useRouter();
  const loginMutation = useLogin();

  const isAuthenticated = !!user;

  async function signIn(credentials: Record<'email' | 'password', string>) {
    try {
      const response = await loginMutation.mutateAsync(credentials);

      // Salva nos cookies (expira em 7 dias)
      Cookies.set('finflow_token', response.token, { expires: 7 });
      Cookies.set('finflow_user', JSON.stringify(response.user), { expires: 7 });

      setUser(response.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Função para o fluxo de registro ou atualização de perfil
  function setAuthenticatedUser(userData: User, token: string) {
    Cookies.set('finflow_token', token, { expires: 7 });
    Cookies.set('finflow_user', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
  }

  function signOut() {
    Cookies.remove('finflow_token');
    Cookies.remove('finflow_user');
    setUser(null);
    loginMutation.reset();
    
    router.push('/login');
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      signIn, 
      setAuthenticatedUser,
      signOut, 
      isLoggingIn: loginMutation.isPending 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
