from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import producto_service
from app.utils.whatsapp import generar_link_whatsapp
from app.schemas import (
    ProductoPublicQueryParams, 
    ProductoPublicPaginatedResponse, 
    ProductoPublicDetalle,
    ProductoPublicCard,
    CarritoWhatsApp,
    CategoriaResponse
)

router = APIRouter(prefix="/api", tags=["Productos"])

def set_cache_header(response: Response, max_age: int = 300):
    response.headers["Cache-Control"] = f"public, max-age={max_age}"

@router.get("/productos", response_model=ProductoPublicPaginatedResponse)
def listar_productos(
    response: Response,
    params: ProductoPublicQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    set_cache_header(response, max_age=300)
    return producto_service.obtener_productos_paginados(
        db=db,
        pagina=params.pagina,
        por_pagina=params.por_pagina,
        categoria_slug=params.categoria,
        busqueda=params.busqueda,
        modelo=params.modelo,
        marca=params.marca,
        precio_min=params.precio_min,
        precio_max=params.precio_max,
        ordenar=params.ordenar
    )

@router.get("/productos/buscar", response_model=list[ProductoPublicCard])
def buscar_productos(
    response: Response,
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db)
):
    set_cache_header(response, max_age=60)
    return producto_service.buscar_productos(db, q, limite=10)

@router.get("/productos/destacados", response_model=list[ProductoPublicCard])
def productos_destacados(response: Response, db: Session = Depends(get_db)):
    set_cache_header(response, max_age=600)
    return producto_service.obtener_productos_destacados(db)

@router.get("/productos/{numero_parte}", response_model=ProductoPublicDetalle)
def detalle_producto(response: Response, numero_parte: str, db: Session = Depends(get_db)):
    producto = producto_service.obtener_producto_por_numero_parte(db, numero_parte)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    set_cache_header(response, max_age=300)
    
    relacionados = []
    if producto.categoria_id:
        relacionados = producto_service.obtener_productos_relacionados(
            db, producto.id, producto.categoria_id
        )
    
    return ProductoPublicDetalle(
        **{c.name: getattr(producto, c.name) for c in producto.__table__.columns},
        categoria_nombre=producto.categoria.nombre if producto.categoria else None,
        categoria_slug=producto.categoria.slug if producto.categoria else None,
        especificaciones=producto.especificaciones,
        compatibilidades=producto.compatibilidades,
        relacionados=relacionados
    )

@router.get("/categorias", response_model=list[CategoriaResponse])
def listar_categorias(response: Response, db: Session = Depends(get_db)):
    set_cache_header(response, max_age=900)
    return producto_service.obtener_categorias_activas(db)

@router.get("/filtros/modelos")
def modelos_disponibles(response: Response, db: Session = Depends(get_db)):
    set_cache_header(response, max_age=1800)
    return producto_service.obtener_modelos_disponibles(db)

@router.get("/filtros/precios")
def rango_precios(response: Response, db: Session = Depends(get_db)):
    set_cache_header(response, max_age=300)
    return producto_service.obtener_rango_precios(db)

@router.post("/whatsapp/generar-link")
def generar_link_wa(carrito: CarritoWhatsApp):
    items = [
        {
            "nombre": item.nombre,
            "numero_parte": item.numero_parte,
            "precio": float(item.precio),
            "cantidad": item.cantidad,
        }
        for item in carrito.items
    ]
    link = generar_link_whatsapp(items, carrito.nombre_cliente)
    return {"link": link}
