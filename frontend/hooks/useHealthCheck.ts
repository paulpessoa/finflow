import { useQuery } from '@tanstack/react-query';

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error('Offline');
      return res.json();
    },
    refetchInterval: 10000, // Checa a cada 10 segundos
    retry: 3,
    refetchOnWindowFocus: true,
  });
}
