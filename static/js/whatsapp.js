function generarMensajeWhatsApp(items, nombreCliente = '') {
    let lineas = [];

    lineas.push(`🛒 *Nuevo Pedido - ${COMPANY_NAME}*`);
    lineas.push('');

    if (nombreCliente) {
        lineas.push(`👤 *Cliente:* ${nombreCliente}`);
        lineas.push('');
    }

    lineas.push('📋 *Productos:*');

    let total = 0;

    items.forEach((item, i) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        lineas.push(
            `${i + 1}. ${item.nombre}\n` +
            `   Parte: ${item.numero_parte} | Cant: ${item.cantidad} | $${item.precio.toFixed(2)} c/u`
        );
    });

    lineas.push('');
    lineas.push(`💰 *Total estimado: $${total.toFixed(2)}*`);
    lineas.push('');
    lineas.push('¡Hola! Me interesa realizar la compra de estos productos. ¿Podrían confirmar disponibilidad y opciones de envío?');

    return lineas.join('\n');
}


function generarMensajeWhatsAppCompleto(items, datos) {
    const metodoPagoLabels = {
        'transferencia': 'Transferencia Bancaria',
        'pago-movil': 'Pago Móvil (BCV)',
        'efectivo': 'Efectivo',
        'zelle': 'Zelle',
        'otro': 'Otro'
    };

    const capitalize = (str) => str && str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() || '';
    const nombreFormat = capitalize(datos.nombre);
    const apellidoFormat = capitalize(datos.apellido);
    const modeloVehiculo = (datos.modeloVehiculo || 'No especificado').toUpperCase();
    const despacho = datos.despacho || 'Delivery';
    const notas = datos.notas || '';
    const cedulaFormat = datos.cedula;
    const telefonoFormat = datos.telefono;
    const metodoLabel = metodoPagoLabels[datos.metodoPago] || datos.metodoPago;

    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const orderId = datos.orderId || 'PENDIENTE';

    let lineas = [];

    lineas.push(`📦 *ORDEN DE PEDIDO: #${orderId}*`);
    lineas.push('---------------------------------------');
    lineas.push('');
    lineas.push(`🏭 *${COMPANY_NAME} - Gestión de Ventas*`);
    lineas.push('');
    lineas.push('👤 *DATOS DEL CLIENTE*');
    lineas.push(`• Nombre: ${nombreFormat} ${apellidoFormat}`);
    lineas.push(`• Cédula/RIF: ${cedulaFormat}`);
    lineas.push(`• Teléfono: ${telefonoFormat}`);
    lineas.push(`• Ubicación: ${datos.direccion}, ${datos.estado}`);
    lineas.push('');
    lineas.push('🚘 *INFORMACIÓN DEL VEHÍCULO*');
    lineas.push(`• Modelo/Año: ${modeloVehiculo}`);
    lineas.push('');
    lineas.push('🛒 *DETALLE DE PRODUCTOS*');

    items.forEach((item, i) => {
        lineas.push(
            `${i + 1}. ${item.nombre}\n` +
            `   • Parte: ${item.numero_parte}\n` +
            `   • Cant: ${item.cantidad} | Precio: $${item.precio.toFixed(2)}`
        );
    });

    lineas.push('');
    lineas.push('💰 *RESUMEN DE TRANSACCIÓN*');
    lineas.push(`• Subtotal: $${total.toFixed(2)}`);
    lineas.push(`• Método de Pago: ${metodoLabel}`);
    lineas.push(`• Despacho: ${despacho}`);
    if (notas) {
        lineas.push(`• Notas: ${notas}`);
    }
    lineas.push('');
    lineas.push('✅ *ESTADO: Pendiente por Confirmación de Disponibilidad*');
    lineas.push('');
    lineas.push('¡Hola! He generado esta solicitud desde el catálogo. Quedo atento a la verificación de stock y los datos para concretas el pago.');

    return lineas.join('\n');
}


function enviarPedidoWhatsApp(nombreCliente = '') {
    const items = obtenerCarrito();

    if (items.length === 0) {
        mostrarToast('Carrito vacío', 'Agrega productos antes de enviar el pedido', 'error');
        return;
    }

    const mensaje = generarMensajeWhatsApp(items, nombreCliente);
    const mensajeEncoded = encodeURIComponent(mensaje);

    const waNumber = document.querySelector('meta[name="whatsapp-number"]')?.content
        || window.WHATSAPP_NUMBER
        || '';

    const waFloat = document.querySelector('.whatsapp-float');
    let numero = waNumber;
    if (!numero && waFloat) {
        const href = waFloat.getAttribute('href');
        const match = href.match(/wa\.me\/(\d+)/);
        if (match) numero = match[1];
    }

    const url = `https://wa.me/${numero}?text=${mensajeEncoded}`;
    window.open(url, '_blank');
}


function enviarPedidoWhatsAppCompleto(datos) {
    const items = obtenerCarrito();

    if (items.length === 0) {
        mostrarToast('Carrito vacío', 'No hay productos en el carrito', 'error');
        return;
    }

    const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const pedidoData = {
        nombre_cliente: datos.nombre,
        apellido_cliente: datos.apellido,
        cedula: datos.cedula,
        telefono: datos.telefono,
        direccion: datos.direccion,
        estado: datos.estado,
        modelo_vehiculo: datos.modeloVehiculo || null,
        despacho: datos.despacho || 'Delivery',
        metodo_pago: datos.metodoPago,
        notas: datos.notas || null,
        productos: items.map(item => ({
            numero_parte: item.numero_parte,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad
        })),
        total: total
    };

    fetch('/api/pedidos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pedidoData)
    })
    .then(response => response.json())
    .then(data => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        
        if (data.detail) {
            mostrarToast('Error', 'No se pudo guardar el pedido: ' + data.detail, 'error');
            return;
        }

        const datosConOrder = {
            ...datos,
            orderId: data.order_id
        };
        const mensaje = generarMensajeWhatsAppCompleto(items, datosConOrder);
        const mensajeEncoded = encodeURIComponent(mensaje);

        let numero = data.whatsapp_asesor || '';
        numero = numero.replace(/\D/g, '');

        const url = `https://wa.me/${numero}?text=${mensajeEncoded}`;
        window.open(url, '_blank');

        vaciarCarrito();
        mostrarToast(
            '¡Pedido enviado!',
            'Tu pedido fue enviado a un asesor. Te contactará pronto.',
            'success'
        );

        setTimeout(() => {
            window.location.href = '/catalogo';
        }, 2000);
    })
    .catch(error => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        console.error('Error:', error);
        mostrarToast('Error', 'Hubo un problema al procesar tu pedido', 'error');
    });
}
