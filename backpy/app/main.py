from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, Category, Transaction # Importar para o Base criar as tabelas

# Cria as tabelas no banco de dados automaticamente (Simples para dev!)
# Em prod usaríamos Alembic para migrações
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinFlow API - Python Edition",
    description="Backend de alta performance em FastAPI para controle financeiro.",
    version="1.0.0"
)

# Configuração de CORS (Essencial para o Frontend conseguir acessar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em prod, colocaríamos apenas o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "FinFlow Python API is online!",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

from . import auth, transactions, categories, ai_router, streaming

# Incluir os roteadores (Endpoints)
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI"])
app.include_router(streaming.router, prefix="/api/streaming", tags=["Streaming"])
