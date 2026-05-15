# FinFlow — Go Backend (Gin + GORM)

The Go edition of FinFlow's backend, built with **Gin** and **GORM**. A high-performance, statically-typed alternative to the Node.js implementation, following Clean Architecture principles.

## Stack

| Layer          | Technology       | Why                                                        |
|----------------|------------------|------------------------------------------------------------|
| Language       | Go 1.22          | Compiled, goroutine-based concurrency, zero runtime deps   |
| Framework      | Gin              | Fast HTTP router with middleware support                    |
| ORM            | GORM             | Code-first ORM, AutoMigrate, struct-based schema           |
| Validation     | Gin binding tags | Declarative validation via struct tags (`binding:"required"`) |
| Auth           | golang-jwt       | JWT generation and verification                            |
| AI Engine      | Groq API (LLaMA 3.3) | Financial insights + streaming Q&A                     |
| Streaming      | SSE + bufio.Scanner | Real-time AI responses via chunked HTTP               |
| Database       | PostgreSQL 16    | Same shared database as all other backends                 |

## Architecture

```
Request → Gin Router → Middleware (auth) → Handler → Repository → GORM → PostgreSQL
```

### Key Design Decisions

- **Repository Pattern** isolates all database access — handlers never touch GORM directly
- **Struct tags** for validation replace external libraries like Zod
- **Clean Architecture** layers: models → repository → handlers → middleware
- **Goroutines** provide natural concurrency without callback complexity

## Project Structure

```
backgo/
├── cmd/
│   └── api/
│       └── main.go          # Entry point: env, DB, routes, server start
├── internal/
│   ├── handlers/
│   │   ├── ai_handler.go     # Groq AI insights + SSE streaming
│   │   └── ...               # Auth, transaction handlers
│   ├── middleware/           # Auth guard (JWT verification)
│   ├── models/              # GORM structs (User, Transaction, Category)
│   └── repository/          # Database access layer (CRUD operations)
├── pkg/
│   └── jwtutil/             # JWT helper functions (create, parse tokens)
├── go.mod / go.sum           # Go module dependencies
├── Dockerfile                # Production container
└── .env                      # Database URL, JWT secret (not committed)
```

> For a deeper architectural walkthrough, see [ARCHITECTURE_GO.md](./ARCHITECTURE_GO.md).

## Getting Started

```bash
cd backgo

# Ensure PostgreSQL is running
go mod download
go run cmd/api/main.go       # Starts on http://localhost:3002
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
| POST   | `/api/ai/insights`     | Bearer   | AI-powered financial analysis (JSON) |
| POST   | `/api/streaming/ask`   | Bearer   | Free-form Q&A with SSE streaming |
