from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean,
    ForeignKey, DateTime, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    imagen_url = Column(String(500), nullable=True)
    icono = Column(String(50), nullable=True)
    activa = Column(Boolean, default=True)
    orden = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    productos = relationship("Producto", back_populates="categoria", lazy="dynamic")

    def __repr__(self):
        return f"<Categoria {self.nombre}>"


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(300), nullable=False)
    numero_parte = Column(String(100), unique=True, nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    imagen_url = Column(String(500), nullable=True)
    disponible = Column(Boolean, default=True)
    destacado = Column(Boolean, default=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    categoria = relationship("Categoria", back_populates="productos")
    compatibilidades = relationship("CompatibilidadVehiculo", back_populates="producto", cascade="all, delete-orphan")
    especificaciones = relationship("Especificacion", back_populates="producto", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_producto_nombre", "nombre"),
        Index("idx_producto_categoria", "categoria_id"),
        Index("idx_producto_disponible", "disponible"),
    )

    def __repr__(self):
        return f"<Producto {self.numero_parte}: {self.nombre}>"


class CompatibilidadVehiculo(Base):
    __tablename__ = "compatibilidad_vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    marca = Column(String(100), nullable=False)
    modelo = Column(String(100), nullable=False)
    anio_inicio = Column(Integer, nullable=True)
    anio_fin = Column(Integer, nullable=True)

    producto = relationship("Producto", back_populates="compatibilidades")

    __table_args__ = (
        Index("idx_compat_modelo", "marca", "modelo"),
        Index("idx_compat_producto", "producto_id"),
    )

    def __repr__(self):
        return f"<Compatibilidad {self.marca} {self.modelo} ({self.anio_inicio}-{self.anio_fin})>"


class Especificacion(Base):
    __tablename__ = "especificaciones"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    aspecto = Column(String(200), nullable=False)
    detalle = Column(Text, nullable=False)

    producto = relationship("Producto", back_populates="especificaciones")

    __table_args__ = (
        Index("idx_espec_producto", "producto_id"),
    )

    def __repr__(self):
        return f"<Especificacion {self.aspecto}: {self.detalle}>"


class Asesor(Base):
    __tablename__ = "asesores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    whatsapp = Column(String(20), nullable=False)
    zona = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pedidos = relationship("Pedido", back_populates="asesor")

    __table_args__ = (
        Index("idx_asesor_zona", "zona"),
        Index("idx_asesor_activo", "activo"),
    )

    def __repr__(self):
        return f"<Asesor {self.nombre} - {self.zona}>"


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(6), unique=True, nullable=False, index=True)
    nombre_cliente = Column(String(150), nullable=False)
    apellido_cliente = Column(String(150), nullable=False)
    cedula = Column(String(20), nullable=False)
    telefono = Column(String(20), nullable=False)
    direccion = Column(Text, nullable=False)
    estado = Column(String(100), nullable=False)
    modelo_vehiculo = Column(String(100), nullable=True)
    despacho = Column(String(50), nullable=False, default="Delivery")
    metodo_pago = Column(String(50), nullable=False)
    notas = Column(Text, nullable=True)
    productos = Column(Text, nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    concretada = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asesor_id = Column(Integer, ForeignKey("asesores.id"), nullable=True)
    asesor = relationship("Asesor", back_populates="pedidos")

    __table_args__ = (
        Index("idx_pedido_fecha", "created_at"),
        Index("idx_pedido_asesor", "asesor_id"),
        Index("idx_pedido_concretada", "concretada"),
    )

    def __repr__(self):
        return f"<Pedido {self.id} - {self.nombre_cliente}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), nullable=False)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(200), nullable=False)
    rol = Column(String(20), nullable=False, default="admin")
    activo = Column(Boolean, default=True)
    ultimo_login = Column(DateTime(timezone=True), nullable=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Usuario {self.username}>"
