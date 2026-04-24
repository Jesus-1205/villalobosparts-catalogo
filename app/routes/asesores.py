from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Asesor
from app.schemas import AsesorResponse

router = APIRouter(prefix="/api/asesores", tags=["Asesores"])

@router.get("", response_model=list[AsesorResponse])
def listar_asesores(db: Session = Depends(get_db)):
    return db.query(Asesor).filter(Asesor.activo == True).all()

@router.get("/zona/{zona}", response_model=AsesorResponse)
def get_asesor_por_zona(zona: str, db: Session = Depends(get_db)):
    asesor = db.query(Asesor).filter(
        Asesor.zona == zona,
        Asesor.activo == True
    ).first()
    
    if not asesor:
        asesor = db.query(Asesor).filter(
            Asesor.zona == "General",
            Asesor.activo == True
        ).first()
    
    if not asesor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay asesores disponibles en este momento"
        )
    
    return asesor
