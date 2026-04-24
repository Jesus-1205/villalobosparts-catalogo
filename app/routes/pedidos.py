import json
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Asesor, Pedido
from app.schemas import PedidoCreate, PedidoResponse

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])

def generar_order_id(db: Session) -> str:
    """Genera order_id aleatorio de 6 caracteres con verificación de unicidad."""
    for _ in range(10):
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.query(Pedido).filter(Pedido.order_id == random_str).first():
            return random_str
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
        detail="Error generando ID de pedido"
    )

def get_asesor_por_estado(db: Session, estado: str) -> Asesor:
    """Asigna asesor según zona o fallback a General."""
    estado_lower = estado.lower().strip()
    zona = "General"
    
    if estado_lower in ["distrito capital", "caracas"]:
        zona = "Caracas"
    elif estado_lower == "aragua":
        zona = "Aragua"
    
    asesor = db.query(Asesor).filter(Asesor.zona == zona, Asesor.activo == True).first()
    
    if not asesor and zona != "General":
        asesor = db.query(Asesor).filter(Asesor.zona == "General", Asesor.activo == True).first()
    
    if not asesor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="No hay asesores disponibles en este momento"
        )
    
    return asesor

@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def crear_pedido(pedido_data: PedidoCreate, db: Session = Depends(get_db)):
    """Crea un pedido y asigna un asesor."""
    order_id = generar_order_id(db)
    asesor = get_asesor_por_estado(db, pedido_data.estado)
    
    productos_json = json.dumps([
        {
            "numero_parte": item.numero_parte,
            "nombre": item.nombre,
            "precio": str(item.precio),
            "cantidad": item.cantidad
        }
        for item in pedido_data.productos
    ])
    
    nuevo_pedido = Pedido(
        order_id=order_id,
        nombre_cliente=pedido_data.nombre_cliente.upper(),
        apellido_cliente=pedido_data.apellido_cliente.upper(),
        cedula=pedido_data.cedula,
        telefono=pedido_data.telefono,
        direccion=pedido_data.direccion.upper(),
        estado=pedido_data.estado,
        modelo_vehiculo=pedido_data.modelo_vehiculo.upper() if pedido_data.modelo_vehiculo else None,
        despacho=pedido_data.despacho,
        metodo_pago=pedido_data.metodo_pago,
        notas=pedido_data.notas,
        productos=productos_json,
        total=pedido_data.total,
        concretada=False,
        asesor_id=asesor.id
    )
    
    try:
        db.add(nuevo_pedido)
        db.commit()
        db.refresh(nuevo_pedido)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar el pedido"
        )
    
    return PedidoResponse(
        id=nuevo_pedido.id,
        order_id=nuevo_pedido.order_id,
        nombre_cliente=nuevo_pedido.nombre_cliente,
        apellido_cliente=nuevo_pedido.apellido_cliente,
        total=nuevo_pedido.total,
        created_at=nuevo_pedido.created_at,
        whatsapp_asesor=asesor.whatsapp
    )
