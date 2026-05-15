from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

router = APIRouter()

@router.get("", response_model=List[schemas.CategoryResponse])
def list_categories(db: Session = Depends(database.get_db)):
    """Lista todas as categorias disponíveis."""
    return db.query(models.Category).all()
