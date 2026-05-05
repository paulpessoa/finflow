import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const baseUrl = await getApiUrl();
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error('Offline');
      return res.json();
    },
    refetchInterval: 10000, // Checa a cada 10 segundos
    retry: 3,
    refetchOnWindowFocus: true,
  });
}
