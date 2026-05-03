import { apiFetch } from '@/lib/api';

export interface AIInsightsResponse {
  rating: 'Saudável' | 'Alerta' | 'Crítico';
  insights: string[];
  actionPlan: string[];
  chartData: { label: string; value: number }[];
}

export const aiService = {
  getInsights: () => {
    return apiFetch<AIInsightsResponse>('/api/ai/insights', {
      method: 'POST',
    });
  }
};
