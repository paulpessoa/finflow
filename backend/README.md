# FinFlow — Node.js Backend (Express + Prisma)

The primary backend for FinFlow, built with **Express** and **Prisma ORM**. This is the original implementation and serves as the reference API that all other backend versions replicate.

## Stack

| Layer          | Technology           | Why                                                      |
|----------------|----------------------|----------------------------------------------------------|
| Runtime        | Node.js 20           | Non-blocking I/O, massive ecosystem                      |
| Framework      | Express 4            | Minimal, flexible, battle-tested                         |
| Language       | TypeScript 5         | End-to-end type safety                                   |
| ORM            | Prisma 5             | Type-safe queries, declarative schema, auto-migrations   |
| Validation     | Zod                  | Schema-based validation with TypeScript inference        |
| Auth           | JWT (jsonwebtoken)   | Stateless auth for horizontal scalability                |
| AI Engine      | Groq API (LLaMA 3.3) | Ultra-fast inference for financial analysis              |
| Streaming      | SSE (Server-Sent Events) | Real-time AI responses via ReadableStream            |
| Database       | PostgreSQL 16        | ACID consistency, robust indexing                        |

## Architecture

```
Request → Express Router → Middleware (auth + zod) → Controller → Prisma Client → PostgreSQL
```

### Key Design Decisions

- **Zod validation** on every input before touching the database
- **Global error handler** middleware — failures never expose stack traces
- **`passwordHash` never returned** in API responses
- **Composite indexes** on `(userId, date)` and `(userId, type)` for dashboard performance
- **JWT Bearer** required on all `/api/transactions/*` endpoints

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers (request → response)
│   ├── middlewares/      # Auth guard, error handler, validation
│   ├── routes/
│   │   ├── ai.ts         # Structured insights (JSON, Zod-validated)
│   │   ├── streaming.ts  # Quick Ask with SSE streaming
│   │   └── ...           # Auth, transactions, dashboard
│   ├── services/
│   │   └── ai/
│   │       ├── AiProvider.ts        # Strategy interface (StreamParams)
│   │       ├── AiServiceFactory.ts  # Factory for provider swapping
│   │       └── providers/
│   │           └── GroqProvider.ts   # Groq API + stream implementation
│   └── server.ts         # App entry point
├── prisma/
│   ├── schema.prisma     # Database schema definition
│   ├── migrations/       # Version-controlled schema changes
│   └── seed.ts           # Demo data seeder
├── .env                  # Database URL, JWT secret (not committed)
├── package.json
└── tsconfig.json
```

## Getting Started

```bash
cd backend
npm install

# Ensure PostgreSQL is running (Docker or Neon)
npx prisma migrate dev     # Apply migrations
npm run db:seed             # Optional: create demo user (paul@demo.com | demo1234)
npm run dev                 # Starts on http://localhost:3001
```

## API Endpoints

| Method | Endpoint               | Auth     | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | `/health`              | Public   | Health check             |
| POST   | `/api/auth/register`   | Public   | Create new user          |
| POST   | `/api/auth/login`      | Public   | Login, returns JWT       |
| GET    | `/api/transactions`    | Bearer   | List user transactions   |
| POST   | `/api/transactions`    | Bearer   | Create transaction       |
| PUT    | `/api/transactions/:id`| Bearer   | Update transaction       |
| DELETE | `/api/transactions/:id`| Bearer   | Delete transaction       |
| GET    | `/api/dashboard`       | Bearer   | Aggregated summary       |
| POST   | `/api/ai/insights`     | Bearer   | AI-powered financial analysis (JSON) |
| POST   | `/api/streaming/ask`   | Bearer   | Free-form Q&A with SSE streaming |

## 🤖 AI Architecture

The AI layer uses the **Strategy Pattern** via `AiProvider` interface + **Factory Pattern** via `AiServiceFactory`, making it trivial to swap Groq for OpenAI, Gemini, or any other provider:

```
Route → AiServiceFactory.getProvider() → GroqProvider.streamChat() → SSE chunks → Frontend
```

- **Insights route** (`/api/ai/insights`): Fetches last 30 days of transactions, aggregates by category, sends to Groq with engineered prompt, validates response with Zod schema, returns structured JSON.
- **Streaming route** (`/api/streaming/ask`): Same context injection but streams the response token-by-token via SSE headers (`text/event-stream`).
- **Rate limiting**: 10 requests/day per user (in-memory Map, MVP-grade).
