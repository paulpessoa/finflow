from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from enum import Enum

# Enum para validação no Pydantic
class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

# Esquemas de Usuário
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas de Categoria
class CategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: str = "💰"

class CategoryResponse(CategoryBase):
    id: str

    class Config:
        from_attributes = True

# Esquemas de Transação
class TransactionBase(BaseModel):
    description: str
    amount: Decimal
    type: TransactionType
    date: datetime
    notes: Optional[str] = None
    category_id: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    category: CategoryResponse

    class Config:
        from_attributes = True

# Esquema para o Sumário (Dashboard)
class DashboardSummary(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
