from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# URL do Banco (Pegando do .env ou usando padrão local)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/finflow")

# O engine é o "motor" que fala com o driver do banco
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cada instância da SessionLocal será uma sessão do banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para nossos modelos herdarem
Base = declarative_base()

# Dependência que será usada nas rotas para obter a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
