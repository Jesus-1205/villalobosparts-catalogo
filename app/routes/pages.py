from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.database import get_db
from app.services import producto_service
from app.config import settings
from app.models import Categoria, Producto, Pedido, Usuario
from app.auth.dependencies import get_current_user
from app.schemas import ProductoQueryParams, PedidoQueryParams, CategoriaResponse, PedidoAdminDetail
import json
from functools import wraps

router = APIRouter(tags=["Páginas"])
templates = Jinja2Templates(directory="templates")

def number_format(value, decimals=2):
    if value is None: return "0.00"
    try: return f"{float(value):,.{decimals}f}"
    except: return str(value)

templates.env.filters["number_format"] = number_format

def contexto_base(request: Request):
    """Contexto común para todas las plantillas."""
    return {
        "request": request,
        "app_name": settings.COMPANY_NAME,
        "company_name": settings.COMPANY_NAME,
        "company_email": settings.COMPANY_EMAIL,
        "company_location": settings.COMPANY_LOCATION,
        "whatsapp_number": settings.WHATSAPP_NUMBER,
        "base_url": settings.BASE_URL,
    }

def admin_required(f):
    """Decorador para proteger rutas del dashboard que devuelven HTML."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        request = kwargs.get("request")
        db = kwargs.get("db")
        token = request.cookies.get("access_token")
        
        if not token:
            return RedirectResponse(url="/dashboard/login", status_code=status.HTTP_302_FOUND)
        
        try:
            clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
            get_current_user(db, clean_token)
        except Exception:
            return RedirectResponse(url="/dashboard/login", status_code=status.HTTP_302_FOUND)
            
        return f(*args, **kwargs)
    return decorated_function


@router.get("/", response_class=HTMLResponse)
def pagina_inicio(request: Request, db: Session = Depends(get_db)):
    categorias = producto_service.obtener_categorias_activas(db)
    destacados = producto_service.obtener_productos_destacados(db)
    
    return templates.TemplateResponse(request, "index.html", {
        **contexto_base(request),
        "categorias": categorias,
        "destacados": destacados,
    })

@router.get("/catalogo", response_class=HTMLResponse)
def pagina_catalogo(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse(request, "catalogo.html", {
        **contexto_base(request),
        "categorias": producto_service.obtener_categorias_activas(db),
        "modelos": producto_service.obtener_modelos_disponibles(db),
        "rango_precios": producto_service.obtener_rango_precios(db),
        "categoria_activa": None,
    })

@router.get("/categoria/{slug}", response_class=HTMLResponse)
def pagina_categoria(slug: str, request: Request, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.slug == slug, Categoria.activa == True).first()
    if not categoria:
        return templates.TemplateResponse(request, "404.html", {**contexto_base(request)}, status_code=404)

    return templates.TemplateResponse(request, "catalogo.html", {
        **contexto_base(request),
        "categorias": producto_service.obtener_categorias_activas(db),
        "modelos": producto_service.obtener_modelos_disponibles(db),
        "rango_precios": producto_service.obtener_rango_precios(db),
        "categoria_activa": {"nombre": categoria.nombre, "slug": categoria.slug, "descripcion": categoria.descripcion},
    })

@router.get("/producto/{numero_parte}", response_class=HTMLResponse)
def pagina_producto(numero_parte: str, request: Request, db: Session = Depends(get_db)):
    producto = producto_service.obtener_producto_por_numero_parte(db, numero_parte)
    if not producto:
        return templates.TemplateResponse(request, "404.html", {**contexto_base(request)}, status_code=404)

    relacionados = []
    if producto.categoria_id:
        relacionados = producto_service.obtener_productos_relacionados(db, producto.id, producto.categoria_id)

    return templates.TemplateResponse(request, "producto.html", {
        **contexto_base(request),
        "producto": producto,
        "relacionados": relacionados,
    })

@router.get("/carrito", response_class=HTMLResponse)
def pagina_carrito(request: Request):
    return templates.TemplateResponse(request, "carrito.html", contexto_base(request))


@router.get("/dashboard/login", response_class=HTMLResponse)
def dashboard_login(request: Request):
    if request.cookies.get("access_token"):
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse(request, "dashboard/login.html", contexto_base(request))

@router.get("/dashboard", response_class=HTMLResponse)
@admin_required
def dashboard_index(request: Request, db: Session = Depends(get_db)):
    stats = {
        "total_productos": db.query(Producto).count(),
        "productos_disponibles": db.query(Producto).filter(Producto.disponible == True).count(),
        "productos_destacados": db.query(Producto).filter(Producto.destacado == True).count(),
        "total_categorias": db.query(Categoria).filter(Categoria.activa == True).count(),
    }
    
    categorias_stats = db.query(
        Categoria.id, Categoria.nombre, func.count(Producto.id).label("productos_count")
    ).outerjoin(Producto).filter(Categoria.activa == True).group_by(Categoria.id).order_by(desc("productos_count")).all()
    
    ultimos_productos = db.query(Producto).order_by(Producto.id.desc()).limit(5).all()

    return templates.TemplateResponse(request, "dashboard/index.html", {
        **contexto_base(request),
        "header_title": "Resumen",
        "stats": stats,
        "ultimos_productos": ultimos_productos,
        "categorias": categorias_stats,
    })

@router.get("/dashboard/productos", response_class=HTMLResponse)
@admin_required
def dashboard_productos(
    request: Request, 
    params: ProductoQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    query = db.query(Producto)
    
    if params.busqueda:
        pattern = f"%{params.busqueda}%"
        query = query.filter(or_(Producto.nombre.ilike(pattern), Producto.numero_parte.ilike(pattern)))
    if params.categoria_id:
        query = query.filter(Producto.categoria_id == params.categoria_id)
    if params.disponible is not None:
        query = query.filter(Producto.disponible == params.disponible)
    if params.destacado is not None:
        query = query.filter(Producto.destacado == params.destacado)

    sort_field, sort_dir = params.ordenar.split("_") if "_" in params.ordenar else ("id", "desc")
    column = getattr(Producto, sort_field, Producto.id)
    query = query.order_by(desc(column) if sort_dir == "desc" else column.asc())

    total = query.count()
    offset = (params.pagina - 1) * params.por_pagina
    productos = query.offset(offset).limit(params.por_pagina).all()
    
    categorias_raw = db.query(Categoria).filter(Categoria.activa == True).order_by(Categoria.nombre).all()
    categorias_data = [CategoriaResponse.model_validate(c).model_dump(mode='json') for c in categorias_raw]

    return templates.TemplateResponse(request, "dashboard/productos/index.html", {
        **contexto_base(request),
        "header_title": "Productos",
        "items": productos,
        "categorias": categorias_data,
        "pagination": {
            "pagina": params.pagina, "total": total, "por_pagina": params.por_pagina,
            "paginas_totales": (total + params.por_pagina - 1) // params.por_pagina,
            "tiene_siguiente": params.pagina * params.por_pagina < total,
            "tiene_anterior": params.pagina > 1,
        },
        "filtros": params.model_dump(mode='json'),
    })

@router.get("/dashboard/productos/nuevo", response_class=HTMLResponse)
@admin_required
def dashboard_producto_nuevo(request: Request, db: Session = Depends(get_db)):
    categorias = db.query(Categoria).filter(Categoria.activa == True).order_by(Categoria.nombre).all()
    return templates.TemplateResponse(request, "dashboard/productos/form.html", {
        **contexto_base(request),
        "header_title": "Nuevo Producto",
        "producto": None,
        "categorias": categorias,
        "especificaciones": [],
        "compatibilidades": [],
    })

@router.get("/dashboard/productos/{producto_id}/editar", response_class=HTMLResponse)
@admin_required
def dashboard_producto_editar(producto_id: int, request: Request, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        return templates.TemplateResponse(request, "404.html", {**contexto_base(request)}, status_code=404)

    categorias = db.query(Categoria).filter(Categoria.activa == True).order_by(Categoria.nombre).all()
    return templates.TemplateResponse(request, "dashboard/productos/form.html", {
        **contexto_base(request),
        "header_title": f"Editar: {producto.numero_parte}",
        "producto": producto,
        "categorias": categorias,
        "especificaciones": producto.especificaciones,
        "compatibilidades": producto.compatibilidades,
    })

@router.get("/dashboard/categorias", response_class=HTMLResponse)
@admin_required
def dashboard_categorias(request: Request, db: Session = Depends(get_db)):
    categorias_raw = db.query(
        Categoria, func.count(Producto.id).label("total_productos")
    ).outerjoin(Producto).group_by(Categoria.id).order_by(Categoria.orden, Categoria.nombre).all()
    
    items = []
    for c, t in categorias_raw:
        cat_dict = CategoriaResponse.model_validate(c).model_dump(mode='json')
        cat_dict["total_productos"] = t
        items.append(cat_dict)
        
    return templates.TemplateResponse(request, "dashboard/categorias/index.html", {
        **contexto_base(request),
        "header_title": "Categorías",
        "items": items,
    })

@router.get("/dashboard/categorias/nueva", response_class=HTMLResponse)
@admin_required
def dashboard_categoria_nueva(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse(request, "dashboard/categorias/form.html", {
        **contexto_base(request), "header_title": "Nueva Categoría", "categoria": None,
    })

@router.get("/dashboard/categorias/{categoria_id}/editar", response_class=HTMLResponse)
@admin_required
def dashboard_categoria_editar(categoria_id: int, request: Request, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        return templates.TemplateResponse(request, "404.html", {**contexto_base(request)}, status_code=404)

    return templates.TemplateResponse(request, "dashboard/categorias/form.html", {
        **contexto_base(request), "header_title": f"Editar: {categoria.nombre}", "categoria": categoria,
    })

@router.get("/dashboard/pedidos", response_class=HTMLResponse)
@admin_required
def dashboard_pedidos(
    request: Request,
    params: PedidoQueryParams = Depends(),
    db: Session = Depends(get_db)
) -> HTMLResponse:
    query = db.query(Pedido)
    if params.busqueda:
        pattern = f"%{params.busqueda}%"
        query = query.filter(or_(Pedido.nombre_cliente.ilike(pattern), Pedido.apellido_cliente.ilike(pattern), Pedido.order_id.ilike(pattern)))
    if params.concretada is not None:
        query = query.filter(Pedido.concretada == params.concretada)

    total = query.count()
    offset = (params.pagina - 1) * params.por_pagina
    pedidos = query.order_by(Pedido.created_at.desc()).offset(offset).limit(params.por_pagina).all()

    items_procesados = []
    for p in pedidos:

        data_cruda = {col.name: getattr(p, col.name) for col in p.__table__.columns}
        data_cruda["productos"] = json.loads(p.productos) if p.productos else []
        data_cruda["total"] = float(p.total)
        if p.asesor:
            data_cruda["asesor_nombre"] = p.asesor.nombre
            data_cruda["asesor_whatsapp"] = p.asesor.whatsapp
        else:
            data_cruda["asesor_nombre"] = "No asignado"
            data_cruda["asesor_whatsapp"] = ""
        data_cruda["created_at"] = p.created_at.isoformat()
        pedido_validado = PedidoAdminDetail(**data_cruda)
        items_procesados.append(pedido_validado.model_dump())

    return templates.TemplateResponse(request, "dashboard/pedidos/index.html", {
        **contexto_base(request),
        "header_title": "Pedidos",
        "items": items_procesados,
        "pagination": {
            "pagina": params.pagina, "total": total, "por_pagina": params.por_pagina,
            "paginas_totales": (total + params.por_pagina - 1) // params.por_pagina,
            "tiene_siguiente": params.pagina * params.por_pagina < total,
            "tiene_anterior": params.pagina > 1,
        },
        "filtros": params.model_dump(mode='json'),
    })
