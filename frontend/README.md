# FinFlow — Frontend (Next.js 15)

The unified frontend for FinFlow, built with **Next.js 15 App Router**. This single frontend connects dynamically to any of the backend implementations (Node, Go, Python) by switching the active provider in the UI or configuring environment variables.

## Live Demo
The frontend is deployed on Vercel:
- **Demo URL:** [finflow-orpin.vercel.app](https://finflow-orpin.vercel.app)

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

## Multi-Backend Provider Selector
The frontend features a dynamic **API Selector** located in the Header (when logged in) and on the Login/Register screens. 
This allows evaluating and testing the dashboard seamlessly against different language stacks:
- **Node.js (Express):** High-concurrency event-loop backend.
- **Go (Gin):** Compiled, ultra-performant, low-memory footprint backend.
- **Python (FastAPI):** Async-first, ideal for ML/AI integrations.

## Getting Started

```bash
cd frontend
pnpm install
pnpm dev                    # Starts on http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001                      # Fallback API URL
NEXT_PUBLIC_NODE_API_URL=https://paulpessoa-finflow-node.render.com     # Node/Express backend
NEXT_PUBLIC_GO_API_URL=https://paulpessoa-finflow-go.render.com         # Go/Gin backend
NEXT_PUBLIC_PYTHON_API_URL=https://paulpessoa-finflow-python.hf.space   # Python/FastAPI backend (Hugging Face)
```

## Project Structure

```
frontend/
├── app/                 # Next.js App Router pages and layouts
│   ├── login/           # Login screen (with API Selector)
│   ├── register/        # Signup screen (with API Selector)
│   └── (dashboard)/     # Main dashboard layout, insights panel and charts
├── components/
│   ├── ApiSelector.tsx  # Dynamic multi-backend selection button bar
│   ├── ApiStatusBadge.tsx# Status indicator querying the active backend health check
│   ├── AiAdvisorPanel.tsx# Structured JSON insights display (rating, action plan, charts)
│   └── AiQuickAsk.tsx   # SSE streaming chat (consumes ReadableStream from python/node/go)
├── contexts/            # React context providers (auth, theme)
├── hooks/
│   ├── useAiInsights.ts # TanStack Query hook for AI insights
│   └── useTransactions.ts# TanStack Query hook for transaction mutations and summaries
├── services/
│   ├── ai.service.ts    # AI API client (structured insights)
│   └── transaction.service.ts # Transaction CRUD and paginated getters
├── lib/                 # apiFetch wrapper handling dynamic header credentials
└── constants/           # Query keys and constants
```

## 🤖 AI Features

- **AI Advisor Panel**: Displays structured financial insights (health rating, key insights, 3-step action plan, expense breakdown chart) fetched via the `useAiInsights` hook.
- **Quick Ask (Streaming)**: Real-time Q&A about your finances using native `ReadableStream` API to consume SSE chunks from the selected backend. Shows a typing cursor animation while streaming.
