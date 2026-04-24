import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    WHATSAPP_NUMBER: str = os.getenv("WHATSAPP_NUMBER", "")
    COMPANY_NAME: str = os.getenv("COMPANY_NAME", "")
    COMPANY_EMAIL: str = os.getenv("COMPANY_EMAIL", "")
    COMPANY_LOCATION: str = os.getenv("COMPANY_LOCATION", "")
    APP_NAME: str = os.getenv("COMPANY_NAME", "")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    PRODUCTS_PER_PAGE: int = 24

settings = Settings()
