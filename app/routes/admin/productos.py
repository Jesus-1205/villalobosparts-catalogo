from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models import Producto, Categoria, CompatibilidadVehiculo, Especificacion, Usuario
from app.schemas import (
    ProductoCreate, ProductoUpdate, ProductoAdminResponse, 
    ProductoQueryParams, ProductoPaginatedResponse,
    CompatibilidadCreate, EspecificacionCreate
)

router = APIRouter(prefix="/api/admin", tags=["Admin Productos"], dependencies=[Depends(get_current_user)])

@router.get("/productos", response_model=ProductoPaginatedResponse)
def listar_productos(
    params: ProductoQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    query = db.query(Producto)

    if params.categoria_id:
        query = query.filter(Producto.categoria_id == params.categoria_id)
    if params.disponible is not None:
        query = query.filter(Producto.disponible == params.disponible)
    if params.destacado is not None:
        query = query.filter(Producto.destacado == params.destacado)
    if params.busqueda:
        pattern = f"%{params.busqueda}%"
        query = query.filter(or_(
            Producto.nombre.ilike(pattern),
            Producto.numero_parte.ilike(pattern)
        ))

    if params.ordenar:
        field, direction = params.ordenar.split("_") if "_" in params.ordenar else ("id", "desc")
        column = getattr(Producto, field, Producto.id)
        query = query.order_by(desc(column) if direction == "desc" else asc(column))

    total = query.count()
    paginas_totales = (total + params.por_pagina - 1) // params.por_pagina
    offset = (params.pagina - 1) * params.por_pagina
    
    items = query.offset(offset).limit(params.por_pagina).all()

    return {
        "items": items,
        "total": total,
        "pagina": params.pagina,
        "por_pagina": params.por_pagina,
        "paginas_totales": paginas_totales,
        "tiene_siguiente": params.pagina < paginas_totales,
        "tiene_anterior": params.pagina > 1
    }

@router.get("/productos/{producto_id}", response_model=ProductoAdminResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.post("/productos", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_producto(producto_data: ProductoCreate, db: Session = Depends(get_db)):
    if db.query(Producto).filter(Producto.numero_parte == producto_data.numero_parte).first():
        raise HTTPException(status_code=400, detail="El número de parte ya existe")

    producto = Producto(
        **producto_data.dict(exclude={"especificaciones", "compatibilidades"})
    )
    db.add(producto)
    db.flush()

    for esp in producto_data.especificaciones:
        db.add(Especificacion(producto_id=producto.id, **esp.dict()))

    for comp in producto_data.compatibilidades:
        db.add(CompatibilidadVehiculo(producto_id=producto.id, **comp.dict()))

    db.commit()
    return {"id": producto.id, "message": "Producto creado exitosamente"}

@router.put("/productos/{producto_id}", response_model=dict)
def actualizar_producto(producto_id: int, producto_data: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for key, value in producto_data.dict(exclude_unset=True).items():
        setattr(producto, key, value)

    db.commit()
    return {"id": producto.id, "message": "Producto actualizado exitosamente"}

@router.delete("/productos/{producto_id}", response_model=dict)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(producto)
    db.commit()
    return {"message": "Producto eliminado exitosamente"}
