# 🚗 Villalobos Parts Catalog

Sistema de catálogo digital de autopartes con panel administrativo completo e integración nativa con WhatsApp para gestión de pedidos.

---

## 🖼️ Vista Previa

| **Página de Inicio** | **Catálogo** | **Tarjeta de Producto** |
|:-------------------:|:-----------:|:---------------------:|
| ![Hero](img/hero.png) | ![Catálogo](img/catalogo_grid.png) | ![Producto](img/product_card.png) |

| **Resumen Pedido** |
|:---------------:|
| ![Pedido](img/resumen_pedido.png) |

---

## 📋 Tabla de Contenidos
1. [Estructura Completa del Directorio](#-estructura-completa-del-directorio)
2. [Características Principales](#-características-principales)
3. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
4. [Instalación y Configuración](#-instalación-y-configuración)
5. [Variables de Entorno](#-variables-de-entorno)
6. [Uso del Sistema](#-uso-del-sistema)
7. [Modelos de Base de Datos](#-modelos-de-base-de-datos)
8. [Licencia](#-licencia)

---

## 📁 Estructura Completa del Directorio
*Se omiten: archivos listados en `.gitignore` (entornos virtuales, cachés, archivos de entorno, directorios `__pycache__`), directorio completo `procesamiento_productos/` y directorio completo `scripts/` por solicitud de la empresa.*

```text
villalobosparts-catalogo/
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 opencode.json
├── 📄 opencode.json.example
├── 📄 requirements.txt
├── 📂 app/
│   ├── 📄 __init__.py
│   ├── 📄 config.py
│   ├── 📄 database.py
│   ├── 📄 main.py
│   ├── 📄 models.py
│   ├── 📄 schemas.py
│   ├── 📂 auth/
│   │   ├── 📄 __init__.py
│   │   ├── 📄 dependencies.py
│   │   └── 📄 security.py
│   ├── 📂 routes/
│   │   ├── 📄 __init__.py
│   │   ├── 📄 asesores.py
│   │   ├── 📄 auth.py
│   │   ├── 📄 pages.py
│   │   ├── 📄 pedidos.py
│   │   ├── 📄 productos.py
│   │   └── 📂 admin/
│   │       ├── 📄 __init__.py
│   │       ├── 📄 categorias.py
│   │       ├── 📄 pedidos.py
│   │       └── 📄 productos.py
│   ├── 📂 services/
│   │   ├── 📄 __init__.py
│   │   └── 📄 producto_service.py
│   └── 📂 utils/
│       ├── 📄 __init__.py
│       └── 📄 whatsapp.py
├── 📂 img/                          <-- Previsualizaciones para README
│   ├── 📄 catalogo_grid.png
│   ├── 📄 hero.png
│   ├── 📄 product_card.png
│   └── 📄 resumen_pedido.png
├── 📂 templates/
│   ├── 📄 404.html
│   ├── 📄 base.html
│   ├── 📄 carrito.html
│   ├── 📄 catalogo.html
│   ├── 📄 index.html
│   ├── 📄 producto.html
│   ├── 📂 dashboard/
│   │   ├── 📄 base.html
│   │   ├── 📄 index.html
│   │   ├── 📄 login.html
│   │   ├── 📂 categorias/
│   │   │   ├── 📄 form.html
│   │   │   └── 📄 index.html
│   │   ├── 📂 pedidos/
│   │   │   └── 📄 index.html
│   │   └── 📂 productos/
│   │       ├── 📄 form.html
│   │       └── 📄 index.html
│   └── 📂 partials/
│       ├── 📄 footer.html
│       ├── 📄 header.html
│       ├── 📄 product_card.html
│       └── 📄 sidebar.html
└── 📂 static/
    ├── 📄 robots.txt
    ├── 📄 site.webmanifest
    ├── 📂 css/
    │   ├── 📄 carrito.css
    │   ├── 📄 catalogo.css
    │   ├── 📄 dashboard.css
    │   ├── 📄 footer.css
    │   ├── 📄 header.css
    │   ├── 📄 home.css
    │   ├── 📄 producto.css
    │   ├── 📄 sidebar.css
    │   └── 📄 styles.css
    ├── 📂 img/
    │   ├── 📂 productos/
    │   │   └── 📄 .gitkeep
    │   ├── 📂 logo/
    │   │   └── 📄 .gitkeep
    │   └── 📂 banners/
    │       └── 📄 .gitkeep
    └── 📂 js/
        ├── 📄 app.js
        ├── 📄 carrito-page.js
        ├── 📄 carrito.js
        ├── 📄 catalogo.js
        ├── 📄 dashboard.js
        ├── 📄 producto.js
        ├── 📄 sidebar.js
        └── 📄 whatsapp.js
```

---

## ✨ Características Principales
### Catálogo Público
- 🔍 Búsqueda por nombre, número de parte y descripción
- 🗂️ Filtros avanzados: categoría, marca/modelo de vehículo, rango de precios
- ⭐ Sección de productos destacados en página de inicio
- 🛒 Carrito de compras con persistencia local
- 📱 Integración nativa con WhatsApp para envío de pedidos directos

> **Ejemplo de mensaje generado:**
> ```
> 🛑 *ORDEN DE PEDIDO: #VT7JP0*
> ────────
> ✳️ *VillalobosParts - Gestión de Ventas*
> 
> 👤 *DATOS DEL CLIENTE*
> • Nombre: Juan José
> • Cédula/RIF: V-12345678
> • Teléfono: 0412-1234567
> • Ubicación: Caracas, Distrito Capital
> 
> 🚗 *INFORMACIÓN DEL VEHÍCULO*
> • Modelo/Año: MUSTANG GT 2009
> 
> 📦 *DETALLE DE PRODUCTOS*
> 1. Biela Motor Ford Motorcraft BE8Z-6200-A
>    • Parte: BE8Z-6200-A
>    • Cant: 1 | Precio: $70.00
> 
> 💰 *RESUMEN DE TRANSACCIÓN*
> • Subtotal: $70.00
> • Método de Pago: Zelle
> • Despacho: Delivery
> 
> ⏳ *ESTADO: Pendiente por Confirmación de Disponibilidad*
> 
> ¡Hola! He generado esta solicitud desde el catálogo. Quedo atento a la verificación de stock y los datos para concretas el pago.
> ```

### Panel Administrativo (Dashboard)
- 🔐 Sistema de autenticación para administradores (JWT)
- 📦 Gestión CRUD completa de productos, categorías y pedidos
- 📊 Estadísticas en tiempo real: total de productos, pedidos, categorías
- 👥 Gestión de asesores de ventas con asignación de pedidos
- 🔄 Actualización de disponibilidad y destacados de productos

### Técnicas
- ⚡ Compresión GZip para respuestas HTTP
- 🌐 Soporte CORS para integraciones externas
- 🗃️ Cache de respuestas API para mejorar rendimiento
- 📱 Diseño responsive para móviles y escritorio

---

## 🛠️ Tecnologías Utilizadas
### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno y rápido para Python
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM para interacción con base de datos
- [PostgreSQL](https://www.postgresql.org/) - Base de datos relacional
- [Pydantic](https://docs.pydantic.dev/) - Validación de datos y esquemas
- [Python-Jose](https://github.com/mpdavis/python-jose) - Manejo de JWT para autenticación
- [Passlib](https://passlib.readthedocs.io/) - Hashing seguro de contraseñas

### Frontend
- [Jinja2](https://jinja.palletsprojects.com/) - Motor de plantillas HTML
- HTML5, CSS3, JavaScript - Interfaz de usuario nativa
- [Starlette](https://www.starlette.io/) - Manejo de archivos estáticos y excepciones

---

## 🚀 Instalación y Configuración
### Requisitos Previos
- Python 3.10+
- PostgreSQL 14+
- Cuenta de administrador creada previamente en la base de datos

### Pasos
1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd villalobosparts-catalogo
   ```

2. **Crear y activar entorno virtual**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   Copia el archivo `.env.example` a `.env` y edita los valores (ver sección siguiente):
   ```bash
   cp .env.example .env
   ```

5. **Configurar base de datos PostgreSQL**
   - Crea una base de datos nueva en PostgreSQL
   - Actualiza `DATABASE_URL` en el archivo `.env` con tus credenciales

6. **Ejecutar la aplicación**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Acceder al sistema**
   - Catálogo público: [http://localhost:8000](http://localhost:8000)
   - Panel administrativo: [http://localhost:8000/dashboard/login](http://localhost:8000/dashboard/login)

---

## ⚙️ Variables de Entorno
Edita el archivo `.env` con los siguientes valores (basado en `.env.example`):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `COMPANY_NAME` | Nombre de la empresa | Villalobos Parts |
| `COMPANY_EMAIL` | Correo de contacto | contacto@villalobosparts.com |
| `COMPANY_LOCATION` | Ubicación física | Caracas, Venezuela |
| `WHATSAPP_NUMBER` | Número de WhatsApp para pedidos | +584123456789 |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/catalogo_db` |
| `DEBUG` | Modo depuración (True/False) | `False` |
| `BASE_URL` | URL base de la aplicación | `http://localhost:8000` |
| `SECRET_KEY` | Clave secreta para JWT | `clave-secreta-segura` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Tiempo de expiración de tokens JWT | `60` |

---

## 💡 Uso del Sistema
### Catálogo Público
1. Navega por categorías en la página de inicio
2. Usa la barra de búsqueda para encontrar productos específicos
3. Filtra por modelo de vehículo, rango de precios o categoría
4. Agrega productos al carrito y genera un enlace de WhatsApp para enviar tu pedido

### Panel Administrativo
1. Inicia sesión en `/dashboard/login` con tus credenciales de administrador
2. Gestiona productos: crea, edita, destaca o cambia disponibilidad
3. Gestiona categorías: crea nuevas, edita orden y visibilidad
4. Revisa pedidos: actualiza estado de entrega y asigna asesores
5. Visualiza estadísticas de productos y pedidos en la página principal del dashboard

---

## 🗃️ Modelos de Base de Datos
Estructura relacional definida en `app/models.py`:

| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `Categoria` | Categorías de productos | 1:N con `Producto` |
| `Producto` | Información de autopartes | N:1 con `Categoria`, 1:N con `Especificacion` y `CompatibilidadVehiculo` |
| `Especificacion` | Detalles técnicos de productos | N:1 con `Producto` |
| `CompatibilidadVehiculo` | Modelos de vehículos compatibles | N:1 con `Producto` |
| `Asesor` | Asesores de ventas | 1:N con `Pedido` |
| `Pedido` | Registro de pedidos de clientes | N:1 con `Asesor` |
| `Usuario` | Administradores del sistema | - |

---

## 📄 Licencia
Este proyecto es privado y pertenece a Villalobos Parts. Todos los derechos reservados.
