from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.auth.security import verificar_password, crear_access_token
from app.config import settings
from app.schemas import Token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    invalid_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuario o contraseña incorrectos",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    
    if not usuario:
        raise invalid_credentials_exception
    
    if not verificar_password(form_data.password, usuario.password_hash):
        raise invalid_credentials_exception
    
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Su cuenta está desactivada. Por favor, contacte al administrador.",
        )

    access_token = crear_access_token(data={"sub": usuario.username})
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=not settings.DEBUG
    )

    return Token(access_token=access_token, token_type="bearer")

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Sesión cerrada correctamente"}
