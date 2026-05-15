from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
from . import models, schemas, database, auth

router = APIRouter()

@router.get("", response_model=schemas.TransactionListResponse)
def list_transactions(
    page: int = 1,
    limit: int = 10,
    type: Optional[models.TransactionType] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    category_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Lista as transações do usuário com filtros e paginação."""
    query = db.query(models.Transaction).options(joinedload(models.Transaction.category)).filter(
        models.Transaction.user_id == current_user.id
    )

    if type:
        query = query.filter(models.Transaction.type == type)
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if from_date:
        try:
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.filter(models.Transaction.date >= dt_from)
        except ValueError:
            pass
    if to_date:
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.filter(models.Transaction.date <= dt_to)
        except ValueError:
            pass

    total = query.count()

    offset = (page - 1) * limit
    transactions = query.order_by(models.Transaction.date.desc()).offset(offset).limit(limit).all()

    import math
    pages = math.ceil(total / limit) if limit > 0 else 1

    return {
        "data": transactions,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }
    }

@router.post("", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Cria uma nova transação vinculada ao usuário atual."""
    # Verificar se a categoria existe
    category = db.query(models.Category).filter(models.Category.id == transaction.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    new_transaction = models.Transaction(
        **transaction.dict(),
        user_id=current_user.id
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    return new_transaction

@router.get("/summary", response_model=schemas.DashboardSummary)
def get_summary(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retorna o resumo financeiro (Entradas, Saídas, Saldo, Detalhado por Categoria)."""
    query = db.query(models.Transaction).options(joinedload(models.Transaction.category)).filter(
        models.Transaction.user_id == current_user.id
    )

    if from_date:
        try:
            # Converter strings de data ISO (ex: 2026-05-20T00:00:00Z)
            dt_from = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.filter(models.Transaction.date >= dt_from)
        except ValueError:
            pass

    if to_date:
        try:
            dt_to = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.filter(models.Transaction.date <= dt_to)
        except ValueError:
            pass

    transactions = query.all()

    income = sum(t.amount for t in transactions if t.type == models.TransactionType.INCOME)
    expense = sum(t.amount for t in transactions if t.type == models.TransactionType.EXPENSE)
    
    # Agrupar despesas por categoria
    category_totals = defaultdict(float)
    category_map = {}
    
    for t in transactions:
        if t.type == models.TransactionType.EXPENSE:
            category_totals[t.category_id] += float(t.amount)
            if t.category_id not in category_map and t.category:
                category_map[t.category_id] = t.category

    by_category = []
    # Ordenar por total descendente
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    
    for cat_id, total in sorted_categories:
        cat = category_map.get(cat_id)
        by_category.append({
            "id": cat_id,
            "name": cat.name if cat else "Outros",
            "color": cat.color if cat else "#cbd5e1",
            "icon": cat.icon if cat else "📁",
            "total": total
        })

    return {
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transactionCount": len(transactions),
        "byCategory": by_category
    }

@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Busca uma transação específica."""
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: str,
    transaction_update: schemas.TransactionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Atualiza uma transação existente."""
    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Remove uma transação."""
    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(db_transaction)
    db.commit()
    return None
