from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models import Categoria, Producto
from app.schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter(prefix="/api/admin", tags=["Admin Categorías"], dependencies=[Depends(get_current_user)])

@router.get("/categorias", response_model=list[CategoriaResponse])
def listar_categorias(
    incluir_inactivas: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(
        Categoria, 
        func.count(Producto.id).label("total_productos")
    ).outerjoin(Producto).group_by(Categoria.id)

    if not incluir_inactivas:
        query = query.filter(Categoria.activa == True)

    results = query.order_by(Categoria.orden, Categoria.nombre).all()

    categorias = []
    for cat, total in results:
        cat_dict = CategoriaResponse.model_validate(cat)
        cat_dict.total_productos = total
        categorias.append(cat_dict)

    return categorias

@router.get("/categorias/{categoria_id}", response_model=CategoriaResponse)
def obtener_categoria(categoria_id: int, db: Session = Depends(get_db)):
    result = db.query(
        Categoria, 
        func.count(Producto.id).label("total_productos")
    ).outerjoin(Producto).filter(Categoria.id == categoria_id).group_by(Categoria.id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    cat, total = result
    cat_response = CategoriaResponse.model_validate(cat)
    cat_response.total_productos = total
    return cat_response

@router.post("/categorias", response_model=dict, status_code=status.HTTP_201_CREATED)
def crear_categoria(categoria_data: CategoriaCreate, db: Session = Depends(get_db)):
    if db.query(Categoria).filter(Categoria.slug == categoria_data.slug).first():
        raise HTTPException(status_code=400, detail=f"El slug '{categoria_data.slug}' ya existe")

    if db.query(Categoria).filter(Categoria.nombre == categoria_data.nombre).first():
        raise HTTPException(status_code=400, detail=f"El nombre '{categoria_data.nombre}' ya existe")

    if not categoria_data.orden:
        max_orden = db.query(func.max(Categoria.orden)).scalar()
        categoria_data.orden = (max_orden + 1) if max_orden else 1

    nueva_categoria = Categoria(**categoria_data.dict())
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)

    return {"id": nueva_categoria.id, "message": "Categoría creada exitosamente"}

@router.put("/categorias/{categoria_id}", response_model=dict)
def actualizar_categoria(
    categoria_id: int,
    categoria_data: CategoriaUpdate,
    db: Session = Depends(get_db)
):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if categoria_data.slug and categoria_data.slug != categoria.slug:
        if db.query(Categoria).filter(Categoria.slug == categoria_data.slug, Categoria.id != categoria_id).first():
            raise HTTPException(status_code=400, detail="El slug ya está en uso")

    for key, value in categoria_data.model_dump(exclude_unset=True).items():
        setattr(categoria, key, value)

    db.commit()
    return {"id": categoria.id, "message": "Categoría actualizada exitosamente"}

@router.delete("/categorias/{categoria_id}", response_model=dict)
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if db.query(Producto).filter(Producto.categoria_id == categoria_id).count() > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar: tiene productos asociados")

    db.delete(categoria)
    db.commit()
    return {"message": "Categoría eliminada exitosamente"}

@router.put("/categorias/reordenar", response_model=dict)
def reordenar_categorias(ordenes: dict[int, int], db: Session = Depends(get_db)):
    for cat_id, nuevo_orden in ordenes.items():
        db.query(Categoria).filter(Categoria.id == cat_id).update({"orden": nuevo_orden})
    
    db.commit()
    return {"message": "Categorías reordenadas exitosamente"}
