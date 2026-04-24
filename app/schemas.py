from pydantic import BaseModel, Field, field_serializer
from typing import List
from decimal import Decimal
from datetime import datetime


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True


class CategoriaBase(BaseSchema):
    nombre: str
    slug: str
    descripcion: str | None = None
    imagen_url: str | None = None
    icono: str | None = None

class CategoriaCreate(CategoriaBase):
    activa: bool = True
    orden: int = 0

class CategoriaUpdate(BaseSchema):
    nombre: str | None = None
    slug: str | None = None
    descripcion: str | None = None
    imagen_url: str | None = None
    icono: str | None = None
    activa: bool | None = None
    orden: int | None = None

class CategoriaResponse(CategoriaBase):
    id: int
    activa: bool
    orden: int
    total_productos: int = 0
    created_at: datetime | None = None


class CompatibilidadCreate(BaseSchema):
    marca: str
    modelo: str
    anio_inicio: int | None = None
    anio_fin: int | None = None

class CompatibilidadResponse(BaseSchema):
    id: int
    marca: str
    modelo: str
    anio_inicio: int | None = None
    anio_fin: int | None = None


class EspecificacionCreate(BaseSchema):
    aspecto: str
    detalle: str

class EspecificacionResponse(BaseSchema):
    id: int
    aspecto: str
    detalle: str


class ProductoPublicCard(BaseSchema):
    id: int
    nombre: str
    numero_parte: str
    precio: Decimal
    imagen_url: str | None = None
    disponible: bool
    destacado: bool
    categoria_nombre: str | None = None
    categoria_slug: str | None = None



class ProductoPublicDetalle(BaseSchema):
    id: int
    nombre: str
    numero_parte: str
    descripcion: str | None = None
    precio: Decimal
    imagen_url: str | None = None
    disponible: bool
    destacado: bool
    categoria_nombre: str | None = None
    categoria_slug: str | None = None
    especificaciones: List[EspecificacionResponse] = []
    compatibilidades: List[CompatibilidadResponse] = []
    relacionados: List[ProductoPublicCard] = []



class ProductoCreate(BaseSchema):
    nombre: str
    numero_parte: str
    descripcion: str | None = None
    precio: Decimal
    imagen_url: str | None = None
    disponible: bool = True
    destacado: bool = False
    categoria_id: int | None = None
    especificaciones: List[EspecificacionCreate] = []
    compatibilidades: List[CompatibilidadCreate] = []

class ProductoUpdate(BaseSchema):
    nombre: str | None = None
    numero_parte: str | None = None
    descripcion: str | None = None
    precio: Decimal | None = None
    imagen_url: str | None = None
    disponible: bool | None = None
    destacado: bool | None = None
    categoria_id: int | None = None

class ProductoAdminResponse(BaseSchema):
    id: int
    nombre: str
    numero_parte: str
    descripcion: str | None = None
    precio: Decimal
    imagen_url: str | None = None
    disponible: bool
    destacado: bool
    categoria_id: int | None = None
    categoria_nombre: str | None = None
    categoria_slug: str | None = None
    especificaciones: List[EspecificacionResponse] = []
    compatibilidades: List[CompatibilidadResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None


class QueryParams(BaseSchema):
    pagina: int = Field(1, ge=1)
    por_pagina: int = Field(20, ge=1, le=100)
    busqueda: str | None = None
    ordenar: str | None = "id_desc"

class ProductoPublicQueryParams(QueryParams):
    categoria: str | None = None
    modelo: str | None = None
    marca: str | None = None
    precio_min: float | None = None
    precio_max: float | None = None

class ProductoQueryParams(QueryParams):
    categoria_id: int | None = None
    disponible: bool | None = None
    destacado: bool | None = None

class PedidoQueryParams(QueryParams):
    concretada: bool | None = None

class PaginatedResponse(BaseSchema):
    total: int
    pagina: int
    por_pagina: int
    paginas_totales: int
    tiene_siguiente: bool
    tiene_anterior: bool

class ProductoPaginatedResponse(PaginatedResponse):
    items: List[ProductoAdminResponse]

class ProductoPublicPaginatedResponse(PaginatedResponse):
    items: List[ProductoPublicCard]

class ItemCarrito(BaseSchema):
    numero_parte: str
    nombre: str
    precio: Decimal
    cantidad: int
    imagen_url: str | None = None

    @field_serializer('precio')
    def serialize_precio(self, precio: Decimal, _info):
        return float(precio)


class CarritoWhatsApp(BaseSchema):
    items: List[ItemCarrito]
    nombre_cliente: str | None = None


class AsesorBase(BaseSchema):
    nombre: str
    whatsapp: str
    zona: str
    activo: bool = True

class AsesorCreate(AsesorBase):
    pass

class AsesorResponse(AsesorBase):
    id: int
    created_at: datetime | None = None



class PedidoAdminItem(BaseSchema):
    id: int
    order_id: str
    nombre_cliente: str
    apellido_cliente: str
    cedula: str
    total: Decimal
    concretada: bool
    created_at: datetime
    metodo_pago: str



class PedidoAdminDetail(BaseSchema):
    id: int
    order_id: str
    nombre_cliente: str
    apellido_cliente: str
    cedula: str
    telefono: str
    direccion: str
    estado: str
    modelo_vehiculo: str | None = None
    despacho: str
    metodo_pago: str
    notas: str | None = None
    productos: List[ItemCarrito]
    total: Decimal
    concretada: bool
    created_at: datetime
    asesor_nombre: str | None = None
    asesor_whatsapp: str | None = None

    @field_serializer('total')
    def serialize_total(self, total: Decimal, _info):
        return float(total)
    @field_serializer('created_at')
    def serialize_fecha(self, fecha: datetime, _info):
        return fecha.strftime('%d/%m/%Y %H:%M')


class PedidoPaginatedResponse(PaginatedResponse):
    items: List[PedidoAdminItem]

class ItemPedido(BaseSchema):
    numero_parte: str
    nombre: str
    precio: Decimal
    cantidad: int


class PedidoCreate(BaseSchema):
    nombre_cliente: str
    apellido_cliente: str
    cedula: str
    telefono: str
    direccion: str
    estado: str
    modelo_vehiculo: str | None = None
    metodo_pago: str
    despacho: str = "Delivery"
    notas: str | None = None
    productos: List[ItemPedido]
    total: Decimal

class PedidoUpdate(BaseSchema):
    concretada: bool | None = None

class PedidoResponse(BaseSchema):
    id: int
    order_id: str
    nombre_cliente: str
    apellido_cliente: str
    total: Decimal
    created_at: datetime
    whatsapp_asesor: str | None = None



class Token(BaseSchema):
    access_token: str
    token_type: str

class TokenData(BaseSchema):
    username: str | None = None

class UsuarioResponse(BaseSchema):
    id: int
    username: str
    nombre_completo: str | None = None
    activo: bool


class LoginRequest(BaseSchema):
    username: str
    password: str
