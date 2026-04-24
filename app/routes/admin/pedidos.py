from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
import json
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models import Pedido
from app.schemas import (
    PedidoUpdate, PedidoQueryParams, PedidoPaginatedResponse, 
    PedidoAdminItem, PedidoAdminDetail
)

router = APIRouter(prefix="/api/admin/pedidos", tags=["Admin Pedidos"], dependencies=[Depends(get_current_user)])

@router.get("", response_model=PedidoPaginatedResponse)
def listar_pedidos(
    params: PedidoQueryParams = Depends(),
    db: Session = Depends(get_db)
):
    query = db.query(Pedido)

    if params.concretada is not None:
        query = query.filter(Pedido.concretada == params.concretada)
    
    if params.busqueda:
        pattern = f"%{params.busqueda}%"
        query = query.filter(or_(
            Pedido.nombre_cliente.ilike(pattern),
            Pedido.apellido_cliente.ilike(pattern),
            Pedido.cedula.ilike(pattern),
            Pedido.order_id.ilike(pattern)
        ))

    total = query.count()
    paginas_totales = (total + params.por_pagina - 1) // params.por_pagina
    offset = (params.pagina - 1) * params.por_pagina
    
    items = query.order_by(desc(Pedido.created_at)).offset(offset).limit(params.por_pagina).all()

    return {
        "items": items,
        "total": total,
        "pagina": params.pagina,
        "por_pagina": params.por_pagina,
        "paginas_totales": paginas_totales,
        "tiene_siguiente": params.pagina < paginas_totales,
        "tiene_anterior": params.pagina > 1
    }

@router.get("/{pedido_id}", response_model=PedidoAdminDetail)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido_dict = PedidoAdminDetail.model_validate(pedido).model_dump()
    try:
        pedido_dict["productos"] = json.loads(pedido.productos)
    except (json.JSONDecodeError, TypeError):
        pedido_dict["productos"] = []
    if pedido.asesor:
        pedido_dict["asesor_nombre"] = pedido.asesor.nombre
        pedido_dict["asesor_whatsapp"] = pedido.asesor.whatsapp
    return PedidoAdminDetail(**pedido_dict)

@router.put("/{pedido_id}", response_model=dict)
def actualizar_pedido(
    pedido_id: int,
    pedido_data: PedidoUpdate,
    db: Session = Depends(get_db)
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido_data.concretada is not None:
        pedido.concretada = pedido_data.concretada

    db.commit()
    return {"message": "Pedido actualizado correctamente", "concretada": pedido.concretada}

@router.delete("/{pedido_id}", response_model=dict)
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    db.delete(pedido)
    db.commit()
    return {"message": f"Pedido {pedido.order_id} eliminado correctamente"}
