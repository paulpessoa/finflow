from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from . import database, auth, models, ai
from pydantic import BaseModel

router = APIRouter()
ai_service = ai.AiService()

class AskRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_question(
    request: AskRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Analisa a pergunta do usuário baseando-se nas transações dos últimos 30 dias."""
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    transactions = db.query(models.Transaction).options(joinedload(models.Transaction.category)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= thirty_days_ago
    ).all()

    total_income = sum(t.amount for t in transactions if t.type == models.TransactionType.INCOME)
    total_expense = sum(t.amount for t in transactions if t.type == models.TransactionType.EXPENSE)
    
    expenses_by_category = {}
    for t in transactions:
        if t.type == models.TransactionType.EXPENSE and t.category:
            cat_name = t.category.name
            expenses_by_category[cat_name] = expenses_by_category.get(cat_name, 0.0) + float(t.amount)

    financial_context = {
        "totalIncome": float(total_income),
        "totalExpense": float(total_expense),
        "balance": float(total_income - total_expense),
        "expensesByCategory": expenses_by_category
    }

    return StreamingResponse(
        ai_service.stream_ask(request.question, financial_context),
        media_type="text/event-stream"
    )
