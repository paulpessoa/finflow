import { useQuery } from '@tanstack/react-query';
import { aiService } from '@/services/ai.service';

export function useAiInsights() {
  return useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: aiService.getInsights,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: false, // The fetch must be triggered manually
  });
}
