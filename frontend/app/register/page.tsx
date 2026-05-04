'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/useAuthHooks';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(4, 'A senha deve ter no mínimo 4 caracteres')
    .max(10, 'A senha deve ter no máximo 10 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const { mutateAsync: registerUser, isPending } = useRegister();
  const { setAuthenticatedUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError('');
    try {
      const response = await registerUser(data);
      
      // Atualiza o estado global e cookies sem recarregar
      setAuthenticatedUser(response.user, response.token);
      
      // Navegação SPA
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta. Tente outro e-mail.';
      setServerError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Criar Conta
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Junte-se ao FinFlow e assuma o controle
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {serverError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nome Completo
              </label>
              <input
                {...register('name')}
                autoComplete="name"
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none sm:text-sm dark:bg-zinc-900 dark:text-zinc-50 ${
                  errors.name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800'
                }`}
                placeholder="João Silva"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none sm:text-sm dark:bg-zinc-900 dark:text-zinc-50 ${
                  errors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Senha
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none sm:text-sm dark:bg-zinc-900 dark:text-zinc-50 ${
                  errors.password ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-800'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
