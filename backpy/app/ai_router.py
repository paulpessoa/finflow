from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from . import database, auth, models, ai
import json

router = APIRouter()
ai_service = ai.AiService()

@router.get("/insights")
async def get_insights(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Analisa as transações do usuário e retorna insights via Streaming (SSE)."""
    
    # Buscar transações recentes
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.date.desc()).limit(20).all()

    if not transactions:
        async def empty_gen():
            yield "Você ainda não tem transações suficientes para uma análise."
        return StreamingResponse(empty_gen(), media_type="text/plain")

    # Formatar dados para a IA
    data_str = "\n".join([
        f"- {t.date}: {t.description} ({t.type}) - R$ {t.amount}" 
        for t in transactions
    ])

    return StreamingResponse(
        ai_service.stream_insights(data_str),
        media_type="text/event-stream"
    )
