from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from app.routes import (
    productos, pages, asesores, pedidos, auth, admin
)

app = FastAPI(
    title=settings.COMPANY_NAME,
    description=f"Catálogo de autopartes - {settings.COMPANY_NAME}",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(productos.router)
app.include_router(pages.router)
app.include_router(asesores.router)
app.include_router(pedidos.router)
app.include_router(auth.router)

app.include_router(admin.productos_router)
app.include_router(admin.categorias_router)
app.include_router(admin.pedidos_router)

templates = Jinja2Templates(directory="templates")

def number_format(value, decimals=2):
    if value is None:
        return "0.00"
    try:
        return f"{float(value):,.{decimals}f}"
    except:
        return str(value)

templates.env.filters["number_format"] = number_format


from fastapi.responses import JSONResponse, HTMLResponse

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return templates.TemplateResponse(request, "404.html", {
            "request": request,
            "app_name": settings.COMPANY_NAME,
            "company_name": settings.COMPANY_NAME,
            "whatsapp_number": settings.WHATSAPP_NUMBER,
            "base_url": settings.BASE_URL,
        }, status_code=404)

    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None)
        )

    detail = exc.detail if settings.DEBUG else "Ha ocurrido un error procesando su solicitud."
    
    return HTMLResponse(
        content=f"<h1>Error {exc.status_code}</h1><p>{detail}</p>",
        status_code=exc.status_code
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    detail = str(exc) if settings.DEBUG else "Error interno del servidor."
    return HTMLResponse(
        content=f"<h1>Error 500</h1><p>{detail}</p>",
        status_code=500
    )


