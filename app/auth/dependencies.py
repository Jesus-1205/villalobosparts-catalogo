from fastapi import Header, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Usuario
from app.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_token_from_header_or_cookie(
    request: Request,
    token: str | None = Depends(oauth2_scheme)
) -> str | None:
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token.replace("Bearer ", "") if cookie_token.startswith("Bearer ") else cookie_token
    
    return token

def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token_from_header_or_cookie)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la sesión",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    usuario = db.query(Usuario).filter(Usuario.username == token_data.username).first()
    if not usuario or not usuario.activo:
        raise credentials_exception
        
    return usuario
