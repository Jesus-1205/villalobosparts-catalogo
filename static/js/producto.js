document.addEventListener('DOMContentLoaded', () => {
    const qtyInput = document.getElementById('product-quantity');
    const qtyDecrease = document.getElementById('qty-decrease');
    const qtyIncrease = document.getElementById('qty-increase');

    qtyDecrease?.addEventListener('click', () => {
        const current = parseInt(qtyInput.value) || 1;
        if (current > 1) qtyInput.value = current - 1;
    });

    qtyIncrease?.addEventListener('click', () => {
        const current = parseInt(qtyInput.value) || 1;
        if (current < 99) qtyInput.value = current + 1;
    });

    qtyInput?.addEventListener('change', () => {
        let val = parseInt(qtyInput.value) || 1;
        val = Math.max(1, Math.min(99, val));
        qtyInput.value = val;
    });


    const addToCartBtn = document.getElementById('add-to-cart-btn');

    addToCartBtn?.addEventListener('click', () => {
        if (typeof PRODUCTO_DATA === 'undefined') return;

        const cantidad = parseInt(qtyInput?.value) || 1;

        agregarAlCarrito({
            numero_parte: PRODUCTO_DATA.numero_parte,
            nombre: PRODUCTO_DATA.nombre,
            precio: PRODUCTO_DATA.precio,
            imagen_url: PRODUCTO_DATA.imagen_url
        }, cantidad);
    });



    const tabs = document.querySelectorAll('.producto-tabs__tab');
    const contents = document.querySelectorAll('.producto-tabs__content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('producto-tabs__tab--active'));
            contents.forEach(c => c.classList.remove('producto-tabs__content--active'));

            tab.classList.add('producto-tabs__tab--active');
            document.getElementById(`tab-${target}`)?.classList.add('producto-tabs__content--active');
        });
    });



    const imageWrapper = document.getElementById('product-image-zoom');
    const mainImage = document.getElementById('product-main-image');

    imageWrapper?.addEventListener('mousemove', (e) => {
        const rect = imageWrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mainImage.style.transformOrigin = `${x}% ${y}%`;
        mainImage.style.transform = 'scale(1.5)';
    });

    imageWrapper?.addEventListener('mouseleave', () => {
        mainImage.style.transformOrigin = 'center center';
        mainImage.style.transform = 'scale(1)';
    });
});
