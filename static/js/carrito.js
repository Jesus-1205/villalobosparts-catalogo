const CARRITO_KEY = 'taller_catalogo_carrito';


function obtenerCarrito() {
    try {
        const data = localStorage.getItem(CARRITO_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function guardarCarrito(items) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    actualizarBadgeCarrito();
}

function agregarAlCarrito(producto, cantidad = 1) {
    const items = obtenerCarrito();

    const index = items.findIndex(item => item.numero_parte === producto.numero_parte);

    if (index >= 0) {
        items[index].cantidad += cantidad;
    } else {
        items.push({
            numero_parte: producto.numero_parte,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: cantidad,
            imagen_url: producto.imagen_url || '/static/img/productos/placeholder.svg'
        });
    }

    guardarCarrito(items);

    mostrarToast(
        '¡Producto agregado!',
        `${producto.nombre} se añadió al carrito`,
        'success'
    );

    animarBadge();
}

function eliminarDelCarrito(numeroParte) {
    let items = obtenerCarrito();
    items = items.filter(item => item.numero_parte !== numeroParte);
    guardarCarrito(items);
}

function actualizarCantidadCarrito(numeroParte, nuevaCantidad) {
    const items = obtenerCarrito();
    const index = items.findIndex(item => item.numero_parte === numeroParte);

    if (index >= 0) {
        if (nuevaCantidad <= 0) {
            items.splice(index, 1);
        } else {
            items[index].cantidad = Math.min(nuevaCantidad, 99);
        }
    }

    guardarCarrito(items);
}

function vaciarCarrito() {
    guardarCarrito([]);
}


function obtenerTotalesCarrito() {
    const items = obtenerCarrito();
    const totalProductos = items.length;
    const totalUnidades = items.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrecio = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    return {
        productos: totalProductos,
        unidades: totalUnidades,
        total: totalPrecio
    };
}

function actualizarBadgeCarrito() {
    const totales = obtenerTotalesCarrito();

    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = totales.unidades;
        badge.style.display = totales.unidades > 0 ? 'flex' : 'none';
    }

    const navCount = document.getElementById('nav-cart-count');
    if (navCount) {
        navCount.textContent = totales.unidades;
        if (totales.unidades > 0) {
            navCount.classList.add('has-items');
        } else {
            navCount.classList.remove('has-items');
        }
    }
}

function animarBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.classList.remove('bounce');
        void badge.offsetWidth; // force reflow
        badge.classList.add('bounce');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarBadgeCarrito();
});
