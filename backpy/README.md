# FinFlow — Python Backend (FastAPI)

The Python edition of FinFlow's backend, built with **FastAPI** and **SQLAlchemy**. This is one of the backend implementations that share the same PostgreSQL schema and serve the same Next.js frontend.

## Live Demo
The Python API is deployed on Hugging Face Spaces:
- **API URL:** `https://paulpessoa-finflow-python.hf.space`
- **Documentation:** `https://paulpessoa-finflow-python.hf.space/docs`

## Stack

| Layer          | Technology            | Why                                                     |
|----------------|-----------------------|---------------------------------------------------------|
| Framework      | FastAPI 0.110         | Async-first, automatic OpenAPI docs, dependency injection |
| ORM            | SQLAlchemy 2.0        | Industry-standard Python ORM, flexible query building    |
| Validation     | Pydantic 2            | Schema-based validation with type hints (Python's Zod)   |
| Auth           | python-jose + bcrypt  | JWT token generation + bcrypt password hashing           |
| Database       | PostgreSQL 16         | ACID consistency, JSONB support, robust indexing          |
| AI Integration | Groq SDK / httpx      | Llama-3.3-70b-versatile via Groq Cloud API              |

## Architecture

```
Request → FastAPI Router → Dependency Injection (auth + validation) → SQLAlchemy → PostgreSQL
```

### Key Design Decisions & System Design

- **Pydantic schemas** validate all input before touching the database (fail-fast approach).
- **Dependency Injection** via FastAPI's `Depends()` for database sessions and JWT authentication.
- **N+1 Query Prevention:** Critical database endpoints (such as transactions listing and dashboard summary) use SQLAlchemy's `joinedload(models.Transaction.category)` to fetch transactions and category metadata in a single query with an SQL `LEFT OUTER JOIN`.
- **No Trailing Slashes:** Endpoints are configured without trailing slashes (e.g. `@router.get("")`) to avoid `307 Temporary Redirect` behavior, preventing modern browsers from stripping the `Authorization` header on cross-origin redirects.
- **Security:** `password_hash` is never exposed in response schemas — enforced at the Pydantic serialization layer.

## Project Structure

```
backpy/
├── app/
│   ├── main.py          # FastAPI app, CORS, router registration
│   ├── database.py      # SQLAlchemy engine, session factory, get_db dependency
│   ├── models.py        # SQLAlchemy ORM models (User, Category, Transaction)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── auth.py          # JWT auth, bcrypt password hashing, login/register routes
│   ├── categories.py    # Categories retrieval endpoints
│   ├── transactions.py  # Transactions CRUD & Dashboard summary calculation
│   ├── streaming.py     # Real-time SSE streaming chat endpoint
│   └── ai.py            # Groq API wrappers for structured JSON and streaming SSE
├── requirements.txt     # Pinned dependencies
└── .env                 # Database URL, JWT secret (not committed)
```

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 16 (local via Docker or Neon)

### Setup

```bash
cd backpy

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env         # Edit with your DATABASE_URL, JWT_SECRET and GROQ_API_KEY

# Run development server
uvicorn app.main:app --reload --port 3001
```

The API will be available at `http://localhost:3001` with interactive Swagger docs at `/docs`.

## API Endpoints

| Method | Endpoint                 | Auth     | Description                                                          |
|--------|--------------------------|----------|----------------------------------------------------------------------|
| GET    | `/`                      | Public   | Root health check                                                    |
| GET    | `/health`                | Public   | Status check returning `{"status": "healthy"}`                       |
| POST   | `/api/auth/register`     | Public   | Create new user, returns JWT and user profile                        |
| POST   | `/api/auth/login`        | Public   | Authenticate credentials, returns JWT                                |
| GET    | `/api/categories`        | Bearer   | List all transaction categories                                      |
| GET    | `/api/transactions`      | Bearer   | List user transactions (supports pagination, date, type and category filtering) |
| POST   | `/api/transactions`      | Bearer   | Create a new transaction                                             |
| GET    | `/api/transactions/summary`| Bearer | Returns income, expense, balance, and expense breakdown grouped by category |
| PUT    | `/api/transactions/:id`  | Bearer   | Update an existing transaction                                       |
| DELETE | `/api/transactions/:id`  | Bearer   | Delete a transaction                                                 |
| POST   | `/api/ai/insights`       | Bearer   | Analyzes 30-day transaction history and returns structured JSON advice|
| POST   | `/api/streaming/ask`     | Bearer   | SSE streaming chat answering financial queries in real-time          |

## Comparing with Other Backends

This is the same FinFlow API implemented in different stacks:

| Backend    | Port | ORM/Driver     | Validation  |
|------------|------|----------------|-------------|
| Node/Express | 3001 | Prisma 5       | Zod         |
| Go/Gin     | 3002 | GORM           | Struct tags |
| Python/FastAPI | 3001 | SQLAlchemy 2 | Pydantic    |
| HTMX (SSR) | 4000 | Axios → Node API | EJS       |
