from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from .models import TransactionType
from decimal import Decimal

# --- Schemas de Usuário ---
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schemas de Categoria ---
class CategoryBase(BaseModel):
    name: str
    color: str
    icon: str

class CategoryResponse(CategoryBase):
    id: str

    class Config:
        from_attributes = True

# --- Schemas de Transação ---
class TransactionBase(BaseModel):
    description: str
    amount: Decimal
    type: TransactionType
    date: datetime
    notes: Optional[str] = None
    category_id: str

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    category_id: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# --- Schemas de Dashboard ---
class CategorySummary(BaseModel):
    id: str
    name: str
    color: str
    icon: str
    total: Decimal

class DashboardSummary(BaseModel):
    income: Decimal
    expense: Decimal
    balance: Decimal
    transactionCount: int
    byCategory: List[CategorySummary]

# --- Schemas de Auth ---
class Token(BaseModel):
    token: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
