from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import Optional, List, Tuple
from app.models import Producto, Categoria, CompatibilidadVehiculo, Especificacion
from app.config import settings
import math


def obtener_productos_paginados(
    db: Session,
    pagina: int = 1,
    por_pagina: Optional[int] = None,
    categoria_slug: Optional[str] = None,
    busqueda: Optional[str] = None,
    modelo: Optional[str] = None,
    marca: Optional[str] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    ordenar: str = "relevancia",
    solo_disponibles: bool = True
) -> dict:
    """
    Obtener productos con filtros, paginación y ordenamiento.
    Retorna dict con items, total, paginación, etc.
    """
    if por_pagina is None:
        por_pagina = settings.PRODUCTS_PER_PAGE

    query = db.query(Producto).options(
        joinedload(Producto.categoria)
    )

    if solo_disponibles:
        query = query.filter(Producto.disponible == True)

    if categoria_slug:
        query = query.join(Categoria).filter(Categoria.slug == categoria_slug)

    if busqueda:
        termino = f"%{busqueda}%"
        query = query.filter(
            or_(
                Producto.nombre.ilike(termino),
                Producto.numero_parte.ilike(termino),
                Producto.descripcion.ilike(termino)
            )
        )

    if modelo or marca:
        query = query.join(CompatibilidadVehiculo)
        if marca:
            query = query.filter(CompatibilidadVehiculo.marca.ilike(f"%{marca}%"))
        if modelo:
            query = query.filter(CompatibilidadVehiculo.modelo.ilike(f"%{modelo}%"))

    if precio_min is not None:
        query = query.filter(Producto.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(Producto.precio <= precio_max)

    total = query.count()

    if ordenar == "precio_asc":
        query = query.order_by(Producto.precio.asc())
    elif ordenar == "precio_desc":
        query = query.order_by(Producto.precio.desc())
    elif ordenar == "nombre_asc":
        query = query.order_by(Producto.nombre.asc())
    elif ordenar == "nombre_desc":
        query = query.order_by(Producto.nombre.desc())
    elif ordenar == "recientes":
        query = query.order_by(Producto.created_at.desc())
    else:
        query = query.order_by(Producto.destacado.desc(), Producto.nombre.asc())

    offset = (pagina - 1) * por_pagina
    productos = query.offset(offset).limit(por_pagina).all()

    paginas_totales = math.ceil(total / por_pagina) if total > 0 else 1

    return {
        "items": productos,
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "paginas_totales": paginas_totales,
        "tiene_siguiente": pagina < paginas_totales,
        "tiene_anterior": pagina > 1,
    }


def obtener_producto_por_numero_parte(db: Session, numero_parte: str) -> Optional[Producto]:
    """Obtener detalle completo de un producto por su número de parte."""
    return db.query(Producto).options(
        joinedload(Producto.categoria),
        joinedload(Producto.especificaciones),
        joinedload(Producto.compatibilidades)
    ).filter(
        Producto.numero_parte == numero_parte
    ).first()


def obtener_producto_por_id(db: Session, producto_id: int) -> Optional[Producto]:
    """Obtener detalle completo de un producto por ID."""
    return db.query(Producto).options(
        joinedload(Producto.categoria),
        joinedload(Producto.especificaciones),
        joinedload(Producto.compatibilidades)
    ).filter(
        Producto.id == producto_id
    ).first()


def buscar_productos(db: Session, termino: str, limite: int = 10) -> List[Producto]:
    """Búsqueda rápida para autocompletado."""
    termino_like = f"%{termino}%"
    return db.query(Producto).filter(
        Producto.disponible == True,
        or_(
            Producto.nombre.ilike(termino_like),
            Producto.numero_parte.ilike(termino_like)
        )
    ).order_by(
        Producto.destacado.desc(),
        Producto.nombre.asc()
    ).limit(limite).all()


def obtener_productos_destacados(db: Session, limite: int = 8) -> List[Producto]:
    """Obtener productos destacados para la landing page."""
    return db.query(Producto).options(
        joinedload(Producto.categoria)
    ).filter(
        Producto.disponible == True,
        Producto.destacado == True
    ).order_by(func.random()).limit(limite).all()


def obtener_productos_relacionados(
    db: Session, producto_id: int, categoria_id: int, limite: int = 4
) -> List[Producto]:
    """Obtener productos relacionados (misma categoría, excluyendo el actual)."""
    return db.query(Producto).options(
        joinedload(Producto.categoria)
    ).filter(
        Producto.disponible == True,
        Producto.categoria_id == categoria_id,
        Producto.id != producto_id
    ).order_by(func.random()).limit(limite).all()


def obtener_categorias_activas(db: Session) -> List[dict]:
    """Obtener categorías activas con conteo de productos."""
    categorias = db.query(
        Categoria,
        func.count(Producto.id).label("total_productos")
    ).outerjoin(
        Producto,
        and_(Producto.categoria_id == Categoria.id, Producto.disponible == True)
    ).filter(
        Categoria.activa == True
    ).group_by(
        Categoria.id
    ).order_by(
        func.count(Producto.id).desc()
    ).all()

    resultado = []
    for cat, total in categorias:
        resultado.append({
            "id": cat.id,
            "nombre": cat.nombre,
            "slug": cat.slug,
            "descripcion": cat.descripcion,
            "imagen_url": cat.imagen_url,
            "icono": cat.icono,
            "activa": cat.activa,
            "orden": cat.orden,
            "total_productos": total,
            "created_at": cat.created_at
        })

    return resultado


def obtener_todas_categorias_activas(db: Session) -> List[dict]:
    """Obtener TODAS las categorías activas con conteo de productos."""
    categorias = db.query(
        Categoria,
        func.count(Producto.id).label("total_productos")
    ).outerjoin(
        Producto,
        and_(Producto.categoria_id == Categoria.id, Producto.disponible == True)
    ).filter(
        Categoria.activa == True
    ).group_by(
        Categoria.id
    ).order_by(
        func.count(Producto.id).desc()
    ).all()

    resultado = []
    for cat, total in categorias:
        resultado.append({
            "id": cat.id,
            "nombre": cat.nombre,
            "slug": cat.slug,
            "descripcion": cat.descripcion,
            "imagen_url": cat.imagen_url,
            "icono": cat.icono,
            "activa": cat.activa,
            "orden": cat.orden,
            "total_productos": total,
            "created_at": cat.created_at
        })

    return resultado


def obtener_modelos_disponibles(db: Session) -> List[dict]:
    """Obtener lista de marcas y modelos de vehículos disponibles."""
    resultados = db.query(
        CompatibilidadVehiculo.marca,
        CompatibilidadVehiculo.modelo,
        func.count(func.distinct(CompatibilidadVehiculo.producto_id)).label("total_productos")
    ).group_by(
        CompatibilidadVehiculo.marca,
        CompatibilidadVehiculo.modelo
    ).order_by(
        CompatibilidadVehiculo.marca.asc(),
        CompatibilidadVehiculo.modelo.asc()
    ).all()

    return [
        {"marca": r.marca, "modelo": r.modelo, "total_productos": r.total_productos}
        for r in resultados
    ]


def obtener_rango_precios(db: Session) -> dict:
    """Obtener el rango de precios disponible."""
    resultado = db.query(
        func.min(Producto.precio).label("min"),
        func.max(Producto.precio).label("max")
    ).filter(Producto.disponible == True).first()

    return {
        "min": float(resultado.min) if resultado.min else 0,
        "max": float(resultado.max) if resultado.max else 0
    }
