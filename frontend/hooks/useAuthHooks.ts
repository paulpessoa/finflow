import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/constants/queryKeys";
import { User } from "@shared/types";

// Service local para auth
export const authService = {
  async getMe() {
    return apiFetch<User>('/api/auth/me');
  },
  async login(credentials: Record<'email' | 'password', string>) {
    return apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  async register(data: Omit<User, 'id'> & { password: string }) {
    return apiFetch<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Record<'email' | 'password', string>) => authService.login(credentials),
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authService.getMe(),
    retry: false,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: Omit<User, 'id'> & { password: string }) => authService.register(data),
  });
}
