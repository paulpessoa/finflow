export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },
  categories: {
    all: ['categories', 'all'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (page: number, limit: number) => ['transactions', 'list', { page, limit }] as const,
    summary: ['transactions', 'summary'] as const,
  },
} as const;
