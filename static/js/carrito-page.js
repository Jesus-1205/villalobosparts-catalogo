let checkoutStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarritoPage();
    setupCheckoutModal();
});


function setupCheckoutModal() {
    const openBtn = document.getElementById('checkout-btn');
    const closeBtn = document.getElementById('checkout-close');
    const overlay = document.getElementById('checkout-overlay');
    const backBtn = document.getElementById('checkout-back');
    const form = document.getElementById('checkout-form');
    const nextBtn = document.getElementById('checkout-next-step');

    openBtn?.addEventListener('click', () => {
        const items = obtenerCarrito();
        if (items.length === 0) {
            mostrarToast('Carrito vacío', 'Agrega productos antes de continuar', 'error');
            return;
        }
        openCheckout();
    });

    closeBtn?.addEventListener('click', closeCheckout);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeCheckout();
    });

    backBtn?.addEventListener('click', () => {
        goToStep(1);
    });

    nextBtn?.addEventListener('click', () => {
        goToStep(2);
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        enviarPedidoConDatos();
    });
}


function openCheckout() {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        goToStep(1);
        resetCheckoutForm();
    }
}


function closeCheckout() {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}


function goToStep(step) {
    checkoutStep = step;

    const step1 = document.getElementById('checkout-step-1');
    const step2 = document.getElementById('checkout-step-2');
    const steps = document.querySelectorAll('.checkout-steps__step');

    console.log(`Intentando ir al paso ${step}`);

    if (step === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
        steps[0].classList.add('checkout-steps__step--active');
        steps[0].classList.remove('checkout-steps__step--done');
        steps[1].classList.remove('checkout-steps__step--active', 'checkout-steps__step--done');
        console.log('Paso 1 activado');
    } else if (step === 2) {
        // Validar antes de cambiar al paso 2
        const campos = [
            { id: 'checkout-nombre', label: 'Nombre' },
            { id: 'checkout-apellido', label: 'Apellido' },
            { id: 'checkout-cedula-tipo', label: 'Tipo de cédula' },
            { id: 'checkout-cedula-num', label: 'Número de cédula' },
            { id: 'checkout-telefono-prefijo', label: 'Prefijo telefónico' },
            { id: 'checkout-telefono-num', label: 'Número de teléfono' },
            { id: 'checkout-direccion', label: 'Dirección' },
            { id: 'checkout-estado', label: 'Estado' },
        ];

        for (const campo of campos) {
            const el = document.getElementById(campo.id);
            if (!el || !el.value.trim()) {
                mostrarToast('Campo requerido', `Por favor ingresa tu ${campo.label.toLowerCase()}`, 'error');
                el?.focus();
                console.log(`Validación falló en: ${campo.label}`);
                return;
            }
        }

        // Validar número de cédula: solo números, 7-9 dígitos
        const cedulaNum = document.getElementById('checkout-cedula-num').value.trim();
        if (!/^\d{7,9}$/.test(cedulaNum)) {
            mostrarToast('Cédula inválida', 'El número de cédula debe tener entre 7 y 9 dígitos numéricos', 'error');
            document.getElementById('checkout-cedula-num').focus();
            return;
        }

        // Validar prefijo telefónico: exactamente 4 dígitos
        const telefonoPrefijo = document.getElementById('checkout-telefono-prefijo').value.trim();
        if (!/^\d{4}$/.test(telefonoPrefijo)) {
            mostrarToast('Prefijo inválido', 'El prefijo debe tener exactamente 4 dígitos (ej: 0424)', 'error');
            document.getElementById('checkout-telefono-prefijo').focus();
            return;
        }

        // Validar número de teléfono: solo números, 7 dígitos
        const telefonoNum = document.getElementById('checkout-telefono-num').value.trim();
        if (!/^\d{7}$/.test(telefonoNum)) {
            mostrarToast('Teléfono inválido', 'El número de teléfono debe tener exactamente 7 dígitos', 'error');
            document.getElementById('checkout-telefono-num').focus();
            return;
        }

        // Validar que el estado sea uno válido de la lista
        const estadoInput = document.getElementById('checkout-estado');
        const estadosValidos = [
            'Distrito Capital', 'Amazonas', 'Anzoátegui', 'Apure', 'Aragua',
            'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro',
            'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas',
            'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo',
            'Vargas', 'Yaracuy', 'Zulia'
        ];
        const estadoIngresado = estadoInput.value.trim();
        
        if (!estadosValidos.some(e => e.toLowerCase() === estadoIngresado.toLowerCase())) {
            mostrarToast('Estado inválido', 'Por favor selecciona un estado de la lista', 'error');
            estadoInput.focus();
            return;
        }

        // Mostrar selector de despacho solo para Aragua
        const despachoTitle = document.getElementById('despacho-title');
        const despachoOptions = document.getElementById('despacho-options');
        const despachoInput = document.getElementById('checkout-despacho');
        console.log('Estado seleccionado:', estadoIngresado);
        if (estadoIngresado.toLowerCase() === 'aragua') {
            if (despachoTitle) despachoTitle.style.display = 'block';
            despachoOptions.style.display = 'grid';
            console.log('Mostrando opciones de despacho (Aragua)');
        } else {
            if (despachoTitle) despachoTitle.style.display = 'none';
            despachoOptions.style.display = 'none';
            if (despachoInput) despachoInput.value = 'Delivery';
            console.log('Ocultando opciones de despacho - Delivery por defecto');
        }

        console.log('Validación exitosa, pasando al paso 2');
        step1.style.display = 'none';
        step2.style.display = 'block';
        steps[0].classList.remove('checkout-steps__step--active');
        steps[0].classList.add('checkout-steps__step--done');
        steps[1].classList.add('checkout-steps__step--active');

        try {
            renderizarResumenCheckout();
        } catch (error) {
            console.error('Error al renderizar resumen:', error);
            mostrarToast('Error', 'No se pudo mostrar el resumen del pedido', 'error');
        }
    }
}


function validarPaso1() {
    const campos = [
        { id: 'checkout-nombre', label: 'Nombre' },
        { id: 'checkout-apellido', label: 'Apellido' },
        { id: 'checkout-cedula-tipo', label: 'Tipo de cédula' },
        { id: 'checkout-cedula-num', label: 'Número de cédula' },
        { id: 'checkout-telefono-prefijo', label: 'Prefijo telefónico' },
        { id: 'checkout-telefono-num', label: 'Número de teléfono' },
        { id: 'checkout-direccion', label: 'Dirección' },
        { id: 'checkout-estado', label: 'Estado' },
    ];

    for (const campo of campos) {
        const el = document.getElementById(campo.id);
        if (!el || !el.value.trim()) {
            mostrarToast('Campo requerido', `Por favor ingresa tu ${campo.label.toLowerCase()}`, 'error');
            el?.focus();
            return false;
        }
    }

    return true;
}


function resetCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (form) form.reset();
}


function renderizarResumenCheckout() {
    const items = obtenerCarrito();
    const totales = obtenerTotalesCarrito();
    const summary = document.getElementById('checkout-summary');

    console.log('renderizarResumenCheckout llamado');
    console.log('items:', items);
    console.log('totales:', totales);
    console.log('summary element:', summary);

    if (!summary) {
        console.error('No se encontró el elemento checkout-summary');
        return;
    }

    const metodoPago = document.querySelector('input[name="metodo-pago"]:checked');
    const metodoPagoMap = {
        'transferencia': 'Transferencia Bancaria',
        'pago-movil': 'Pago Móvil',
        'efectivo': 'Efectivo',
        'zelle': 'Zelle',
        'otro': 'Otro'
    };
    const metodoLabel = metodoPago ? (metodoPagoMap[metodoPago.value] || metodoPago.value) : 'No seleccionado';

    const nombre = document.getElementById('checkout-nombre').value.trim();
    const apellido = document.getElementById('checkout-apellido').value.trim();
    const cedulaTipo = document.getElementById('checkout-cedula-tipo').value.trim();
    const cedulaNum = document.getElementById('checkout-cedula-num').value.trim();
    const cedula = `${cedulaTipo}-${cedulaNum}`;
    const telefonoPrefijo = document.getElementById('checkout-telefono-prefijo').value.trim();
    const telefonoNum = document.getElementById('checkout-telefono-num').value.trim();
    const telefono = `${telefonoPrefijo}-${telefonoNum}`;
    const direccion = document.getElementById('checkout-direccion').value.trim();
    const estado = document.getElementById('checkout-estado').value.trim();
    const modeloVehiculo = document.getElementById('checkout-modelo-vehiculo')?.value.trim().toUpperCase() || 'No especificado';
    const despacho = document.getElementById('checkout-despacho')?.value || 'Delivery';

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const nombreFormat = capitalize(nombre);
    const apellidoFormat = capitalize(apellido);

    console.log('Datos del cliente:', { nombre, apellido, cedula, telefono, direccion, estado, metodoLabel });

    let html = '';

    // Productos
    items.forEach(item => {
        html += `
            <div class="checkout-summary__item">
                <div>
                    <span class="checkout-summary__item-name">${item.nombre}</span>
                    <span class="checkout-summary__item-qty">x${item.cantidad}</span>
                </div>
                <span class="checkout-summary__item-price">${formatearPrecio(item.precio * item.cantidad)}</span>
            </div>
        `;
    });

    // Divider y total
    html += `<div class="checkout-summary__divider"></div>`;
    html += `
        <div class="checkout-summary__total">
            <span>Total</span>
            <span>${formatearPrecio(totales.total)}</span>
        </div>
    `;

    // Datos del cliente
    html += `
        <div class="checkout-summary__data">
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Cliente</span>
                <span class="checkout-summary__data-value">${nombreFormat} ${apellidoFormat}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Cédula</span>
                <span class="checkout-summary__data-value">${cedula}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Teléfono</span>
                <span class="checkout-summary__data-value">${telefono}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Dirección</span>
                <span class="checkout-summary__data-value">${direccion}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Estado</span>
                <span class="checkout-summary__data-value">${estado}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Vehículo</span>
                <span class="checkout-summary__data-value">${modeloVehiculo}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Despacho</span>
                <span class="checkout-summary__data-value">${despacho}</span>
            </div>
            <div class="checkout-summary__data-row">
                <span class="checkout-summary__data-label">Método de pago</span>
                <span class="checkout-summary__data-value">${metodoLabel}</span>
            </div>
        </div>
    `;

    console.log('HTML generado:', html);
    summary.innerHTML = html;
    console.log('Resumen renderizado correctamente');
}


function enviarPedidoConDatos() {
    const cedulaTipo = document.getElementById('checkout-cedula-tipo').value.trim();
    const cedulaNum = document.getElementById('checkout-cedula-num').value.trim();
    const telefonoPrefijo = document.getElementById('checkout-telefono-prefijo').value.trim();
    const telefonoNum = document.getElementById('checkout-telefono-num').value.trim();

    const datos = {
        nombre: document.getElementById('checkout-nombre').value.trim(),
        apellido: document.getElementById('checkout-apellido').value.trim(),
        cedula: `${cedulaTipo}-${cedulaNum}`,
        telefono: `${telefonoPrefijo}-${telefonoNum}`,
        direccion: document.getElementById('checkout-direccion').value.trim(),
        estado: document.getElementById('checkout-estado').value.trim(),
        modeloVehiculo: document.getElementById('checkout-modelo-vehiculo')?.value.trim().toUpperCase() || '',
        despacho: document.getElementById('checkout-despacho')?.value || 'Delivery',
        metodoPago: document.querySelector('input[name="metodo-pago"]:checked')?.value || '',
        notas: document.getElementById('checkout-notas')?.value.trim() || '',
    };

    const items = obtenerCarrito();
    if (items.length === 0) {
        mostrarToast('Carrito vacío', 'No hay productos en el carrito', 'error');
        return;
    }

    // Validar que el estado sea uno válido de la lista
    const estadosValidos = [
        'Distrito Capital', 'Amazonas', 'Anzoátegui', 'Apure', 'Aragua',
        'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro',
        'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas',
        'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo',
        'Vargas', 'Yaracuy', 'Zulia'
    ];
    
    if (!estadosValidos.some(e => e.toLowerCase() === datos.estado.toLowerCase())) {
        mostrarToast('Estado inválido', 'Por favor selecciona un estado de la lista', 'error');
        return;
    }

    enviarPedidoWhatsAppCompleto(datos);
    closeCheckout();
}


function renderizarCarritoPage() {
    const items = obtenerCarrito();
    const carritoLayout = document.getElementById('carrito-layout');
    const carritoEmpty = document.getElementById('carrito-empty');
    const carritoItems = document.getElementById('carrito-items');

    if (items.length === 0) {
        if (carritoLayout) carritoLayout.style.display = 'none';
        if (carritoEmpty) carritoEmpty.style.display = 'block';
        return;
    }

    if (carritoLayout) carritoLayout.style.display = 'grid';
    if (carritoEmpty) carritoEmpty.style.display = 'none';

    carritoItems.innerHTML = items.map(item => {
        const subtotal = item.precio * item.cantidad;
        return `
            <div class="carrito-item" data-numero-parte="${item.numero_parte}">
                <img
                    src="${item.imagen_url || '/static/img/productos/placeholder.svg'}"
                    alt="${item.nombre}"
                    class="carrito-item__image"
                    onerror="this.src='/static/img/productos/placeholder.svg'"
                >
                <div class="carrito-item__info">
                    <h3 class="carrito-item__name">
                        <a href="/producto/${item.numero_parte}">${item.nombre}</a>
                    </h3>
                    <span class="carrito-item__part">
                        <i class="fa-solid fa-barcode"></i> ${item.numero_parte}
                    </span>
                    <span class="carrito-item__price">${formatearPrecio(item.precio)} c/u</span>
                </div>
                <div class="carrito-item__actions">
                    <div class="carrito-item__quantity">
                        <button class="carrito-item__qty-btn" onclick="cambiarCantidadPage('${item.numero_parte}', -1)">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <input
                            type="number"
                            class="carrito-item__qty-input"
                            value="${item.cantidad}"
                            min="1"
                            max="99"
                            onchange="setCantidadPage('${item.numero_parte}', this.value)"
                        >
                        <button class="carrito-item__qty-btn" onclick="cambiarCantidadPage('${item.numero_parte}', 1)">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <span class="carrito-item__subtotal">${formatearPrecio(subtotal)}</span>
                    <button class="carrito-item__remove" onclick="eliminarItemPage('${item.numero_parte}')">
                        <i class="fa-solid fa-trash-can"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    actualizarResumen();
}


function actualizarResumen() {
    const totales = obtenerTotalesCarrito();

    const itemsCount = document.getElementById('summary-items-count');
    const unitsCount = document.getElementById('summary-units-count');
    const totalEl = document.getElementById('summary-total');

    if (itemsCount) itemsCount.textContent = totales.productos;
    if (unitsCount) unitsCount.textContent = totales.unidades;
    if (totalEl) totalEl.textContent = formatearPrecio(totales.total);
}


function cambiarCantidadPage(numeroParte, delta) {
    const items = obtenerCarrito();
    const item = items.find(i => i.numero_parte === numeroParte);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad < 1) return;

    actualizarCantidadCarrito(numeroParte, nuevaCantidad);
    renderizarCarritoPage();
}


function setCantidadPage(numeroParte, valor) {
    let cantidad = parseInt(valor) || 1;
    cantidad = Math.max(1, Math.min(99, cantidad));

    actualizarCantidadCarrito(numeroParte, cantidad);
    renderizarCarritoPage();
}


function eliminarItemPage(numeroParte) {
    eliminarDelCarrito(numeroParte);
    mostrarToast('Producto eliminado', 'Se eliminó del carrito', 'info');
    renderizarCarritoPage();
}
