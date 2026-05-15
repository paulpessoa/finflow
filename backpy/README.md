# FinFlow — Python Backend (FastAPI)

The Python edition of FinFlow's backend, built with **FastAPI** and **SQLAlchemy**. This is one of five backend implementations that share the same PostgreSQL schema and serve the same Next.js frontend.

## Stack

| Layer          | Technology            | Why                                                     |
|----------------|-----------------------|---------------------------------------------------------|
| Framework      | FastAPI 0.110         | Async-first, automatic OpenAPI docs, dependency injection |
| ORM            | SQLAlchemy 2.0        | Industry-standard Python ORM, flexible query building    |
| Validation     | Pydantic 2            | Schema-based validation with type hints (Python's Zod)   |
| Auth           | python-jose + passlib | JWT token generation + bcrypt password hashing           |
| Database       | PostgreSQL 16         | ACID consistency, JSONB support, robust indexing          |

## Architecture

```
Request → FastAPI Router → Dependency Injection (auth + validation) → SQLAlchemy → PostgreSQL
```

### Key Design Decisions

- **Pydantic schemas** validate all input before touching the database (fail-fast approach)
- **Dependency Injection** via FastAPI's `Depends()` for database sessions and auth
- **Strategic indexes** on `(user_id, date)` and `(user_id, type)` for dashboard query performance
- **`password_hash` never exposed** in response schemas — enforced at the Pydantic layer

## Project Structure

```
backpy/
├── app/
│   ├── main.py          # FastAPI app, CORS, router registration
│   ├── database.py      # SQLAlchemy engine, session factory, get_db dependency
│   ├── models.py        # SQLAlchemy ORM models (User, Category, Transaction)
│   ├── schemas.py       # Pydantic request/response schemas
│   └── auth.py          # JWT auth, password hashing, signup/login routes
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
cp .env.example .env         # Edit with your DATABASE_URL and JWT_SECRET

# Run development server
uvicorn app.main:app --reload --port 3003
```

The API will be available at `http://localhost:3003` with interactive docs at `/docs`.

## API Endpoints

| Method | Endpoint               | Auth     | Description              |
|--------|------------------------|----------|--------------------------|
| GET    | `/`                    | Public   | Health check             |
| POST   | `/api/auth/signup`     | Public   | Create new user          |
| POST   | `/api/auth/login`      | Public   | Login, returns JWT       |
| GET    | `/api/transactions`    | Bearer   | List user transactions   |
| POST   | `/api/transactions`    | Bearer   | Create transaction       |
| PUT    | `/api/transactions/:id`| Bearer   | Update transaction       |
| DELETE | `/api/transactions/:id`| Bearer   | Delete transaction       |

## Comparing with Other Backends

This is the same FinFlow API implemented in different stacks:

| Backend    | Port | ORM/Driver     | Validation  |
|------------|------|----------------|-------------|
| Node/Express | 3001 | Prisma 5       | Zod         |
| Go/Gin     | 3002 | GORM           | Struct tags |
| Python/FastAPI | 3003 | SQLAlchemy 2 | Pydantic    |
| HTMX (SSR) | 4000 | Axios → Node API | EJS       |
