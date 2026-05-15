# FinFlow — Frontend (Next.js 15)

The unified frontend for FinFlow, built with **Next.js 15 App Router**. This single frontend connects to any of the backend implementations (Node, Go, Python) by switching an environment variable.

## Stack

| Layer              | Technology              | Why                                                  |
|--------------------|-------------------------|------------------------------------------------------|
| Framework          | Next.js 15 (App Router) | SSR for SEO/performance, file-based routing          |
| Language           | TypeScript              | End-to-end type safety with backend schemas          |
| Styling            | Tailwind CSS 4          | Utility-first, rapid prototyping                     |
| State Management   | TanStack Query          | Server state caching, optimistic updates             |
| Forms              | React Hook Form + Zod   | Performant forms with schema validation              |
| Charts             | Recharts                | Declarative, responsive financial charts             |
| AI Integration     | Groq API (via backend)  | Financial insights + real-time streaming Q&A         |

## Getting Started

```bash
cd frontend
pnpm install
pnpm dev                    # Starts on http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001           # Default (Node backend)
NEXT_PUBLIC_NODE_API_URL=http://localhost:3001      # Node/Express backend
NEXT_PUBLIC_GO_API_URL=http://localhost:3002        # Go/Gin backend
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:3003    # Python/FastAPI backend
```

Switch the active backend by changing `NEXT_PUBLIC_API_URL` to point at any of the implementations.

## Project Structure

```
frontend/
├── app/                 # Next.js App Router pages and layouts
├── components/
│   ├── AiAdvisorPanel.tsx  # Structured insights display (rating, action plan, chart)
│   ├── AiQuickAsk.tsx      # Free-form Q&A with SSE streaming (ReadableStream API)
│   └── ...                 # Dashboard, forms, tables
├── contexts/            # React context providers (auth, theme)
├── hooks/
│   ├── useAiInsights.ts    # TanStack Query hook for AI insights
│   └── ...                 # useAuth, useTransactions
├── services/
│   ├── ai.service.ts       # AI API client (insights, streaming)
│   └── ...                 # Auth, transactions
├── lib/                 # Utility functions
├── constants/           # App-wide constants
└── public/              # Static assets
```

## 🤖 AI Features

- **AI Advisor Panel**: Displays structured financial insights (health rating, key insights, 3-step action plan, expense breakdown chart) fetched via `useAiInsights` TanStack Query hook.
- **Quick Ask (Streaming)**: Real-time Q&A about your finances using native `ReadableStream` API to consume SSE chunks from the backend. Shows a typing cursor animation while streaming.

## Deploy

The frontend is deployed on **Vercel** at [finflow-orpin.vercel.app](https://finflow-orpin.vercel.app).

Production environment variables point to the hosted backend APIs on Render.
