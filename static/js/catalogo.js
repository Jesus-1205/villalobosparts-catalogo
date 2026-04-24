let paginaActual = 1;
let cargando = false;
let debounceTimer = null;

let precioMinInicial = '';
let precioMaxInicial = '';

const productsGrid = document.getElementById('products-grid');
const productsSkeleton = document.getElementById('products-skeleton');
const emptyState = document.getElementById('empty-state');
const resultsCount = document.getElementById('results-count');
const pagination = document.getElementById('pagination');
const sortSelect = document.getElementById('sort-select');
const filterSearch = document.getElementById('filter-search');
const filtersSidebar = document.getElementById('filters-sidebar');
const filtersOverlay = document.getElementById('filters-overlay');
const filtersToggle = document.getElementById('filters-toggle');
const filtersClose = document.getElementById('filters-close');
const filtersReset = document.getElementById('filters-reset');
const filterCategoriaSearch = document.getElementById('filter-categoria-search');
const filterBadge = document.getElementById('filter-badge');
const filtersActive = document.getElementById('filters-active');
const filtersActiveTags = document.getElementById('filters-active-tags');
const filtersClearAll = document.getElementById('filters-clear-all');
const searchClear = document.getElementById('search-clear');


function initAccordions() {
    const headers = document.querySelectorAll('.filter-group__header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            const body = header.nextElementSibling;

            header.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                body.classList.remove('filter-group__body--open');
            } else {
                body.classList.add('filter-group__body--open');
            }
        });
    });
}


function debounce(fn, delay = 400) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
}


function contarFiltrosActivos() {
    let count = 0;
    const tags = [];

    const busqueda = filterSearch?.value.trim();
    if (busqueda) {
        count++;
        tags.push({ type: 'search', label: `"${busqueda}"`, value: busqueda });
    }

    document.querySelectorAll('input[name="categoria"]:checked').forEach(cb => {
        count++;
        const label = cb.closest('.filter-checkbox').querySelector('.filter-checkbox__label').textContent.trim();
        tags.push({ type: 'categoria', label: label, value: cb.value });
    });

    const precioMin = document.getElementById('filter-precio-min')?.value;
    const precioMax = document.getElementById('filter-precio-max')?.value;
    if (precioMin && precioMin !== precioMinInicial && parseFloat(precioMin) > 0) {
        count++;
        tags.push({ type: 'precio_min', label: `Desde $${precioMin}`, value: precioMin });
    }
    if (precioMax && precioMax !== precioMaxInicial && parseFloat(precioMax) > 0) {
        count++;
        tags.push({ type: 'precio_max', label: `Hasta $${precioMax}`, value: precioMax });
    }

    if (filterBadge) {
        if (count > 0) {
            filterBadge.textContent = count;
            filterBadge.style.display = 'inline-flex';
        } else {
            filterBadge.style.display = 'none';
        }
    }

    renderFilterTags(tags);

    return count;
}


function renderFilterTags(tags) {
    if (!filtersActive || !filtersActiveTags) return;

    if (tags.length === 0) {
        filtersActive.style.display = 'none';
        return;
    }

    filtersActive.style.display = 'block';
    filtersActiveTags.innerHTML = tags.map(tag => `
        <button class="filter-tag" data-type="${tag.type}" data-value="${tag.value}">
            ${tag.label}
            <i class="fa-solid fa-xmark filter-tag__remove"></i>
        </button>
    `).join('');

    // Evento para remover tag individual
    filtersActiveTags.querySelectorAll('.filter-tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
            removeFilter(tagEl.dataset.type, tagEl.dataset.value);
        });
    });
}


function removeFilter(type, value) {
    switch (type) {
        case 'search':
            if (filterSearch) filterSearch.value = '';
            if (searchClear) searchClear.style.display = 'none';
            break;
        case 'categoria':
            const catCb = document.querySelector(`input[name="categoria"][value="${value}"]`);
            if (catCb) catCb.checked = false;
            break;
        case 'modelo':
            break;
        case 'precio_min':
            const pMin = document.getElementById('filter-precio-min');
            if (pMin) pMin.value = precioMinInicial;
            break;
        case 'precio_max':
            const pMax = document.getElementById('filter-precio-max');
            if (pMax) pMax.value = precioMaxInicial;
            break;
    }

    contarFiltrosActivos();
    cargarProductos(1);
}


async function cargarProductos(pagina = 1) {
    console.log('cargarProductos llamado, pagina:', pagina);
    if (cargando) return;
    cargando = true;

    // Mostrar skeleton
    productsGrid.style.display = 'none';
    productsSkeleton.style.display = 'grid';
    emptyState.style.display = 'none';
    pagination.innerHTML = '';

    // Construir query params
    const params = new URLSearchParams();
    params.set('pagina', pagina);

    // Debug
    const categoriasChecked = document.querySelectorAll('input[name="categoria"]:checked');

    // Búsqueda
    const busqueda = filterSearch?.value.trim();
    if (busqueda) params.set('busqueda', busqueda);

    // Categoría
    if (categoriasChecked.length === 1) {
        params.set('categoria', categoriasChecked[0].value);
    }

    const precioMin = document.getElementById('filter-precio-min')?.value;
    const precioMax = document.getElementById('filter-precio-max')?.value;
    if (precioMin && parseFloat(precioMin) > 0) params.set('precio_min', precioMin);
    if (precioMax && parseFloat(precioMax) > 0) params.set('precio_max', precioMax);

    const ordenar = sortSelect?.value || 'relevancia';
    params.set('ordenar', ordenar);

    contarFiltrosActivos();

    try {
        const url = `/api/productos?${params.toString()}`;
        console.log('Fetching URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        productsSkeleton.style.display = 'none';

        if (data.items.length === 0) {
            productsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            resultsCount.textContent = 'No se encontraron productos';
        } else {
            productsGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            renderizarProductos(data.items);
            renderizarPaginacion(data);
            resultsCount.textContent = `Mostrando ${((data.pagina - 1) * 24) + 1}–${Math.min(data.pagina * 24, data.total)} de ${data.total} resultados`;
        }

        paginaActual = data.pagina;

        // Actualizar URL sin recargar
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);

    } catch (error) {
        console.error('Error cargando productos:', error);
        productsSkeleton.style.display = 'none';
        
        let errorMsg = 'Error al cargar los productos. Intenta de nuevo.';
        if (error.message.includes('HTTP 500')) {
            errorMsg = 'Error interno del servidor. Intenta más tarde.';
        }
        
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-500);">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
                ${errorMsg}
            </div>
        `;
        productsGrid.style.display = 'grid';
    }

    cargando = false;
}


function renderizarProductos(productos) {
    productsGrid.innerHTML = productos.map(prod => `
        <article class="product-card" data-numero-parte="${prod.numero_parte}">
            <a href="/producto/${prod.numero_parte}" class="product-card__image-link">
                <div class="product-card__image-wrapper">
                    <img
                        src="${prod.imagen_url || '/static/img/productos/placeholder.svg'}"
                        alt="${prod.nombre}"
                        class="product-card__image"
                        loading="lazy"
                        onerror="this.src='/static/img/productos/placeholder.svg'"
                    >
                </div>
            </a>
            <div class="product-card__info">
                <a href="/producto/${prod.numero_parte}" class="product-card__title-link">
                    <h3 class="product-card__title">${prod.nombre}</h3>
                </a>
                <p class="product-card__part-number">
                    <i class="fa-solid fa-barcode"></i> ${prod.numero_parte}
                </p>
                <div class="product-card__bottom">
                    <p class="product-card__price">$${Number(prod.precio).toFixed(2)}</p>
                    <button
                        class="product-card__add-btn"
                        onclick="agregarAlCarrito({
                            numero_parte: '${prod.numero_parte}',
                            nombre: '${prod.nombre.replace(/'/g, "\\'")}',
                            precio: ${prod.precio},
                            imagen_url: '${prod.imagen_url || '/static/img/productos/placeholder.svg'}'
                        })"
                        title="Añadir al carrito"
                    >
                        <i class="fa-solid fa-cart-plus"></i>
                        <span class="product-card__add-text">Añadir</span>
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}


function renderizarPaginacion(data) {
    console.log('Renderizando paginacion:', data);
    if (data.paginas_totales <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Botón anterior
    html += `<button class="pagination__btn" ${data.pagina <= 1 ? 'disabled' : ''} onclick="irAPagina(${data.pagina - 1})">
        <i class="fa-solid fa-chevron-left"></i>
    </button>`;

    // Números de página
    const maxVisible = 5;
    let inicio = Math.max(1, data.pagina - Math.floor(maxVisible / 2));
    let fin = Math.min(data.paginas_totales, inicio + maxVisible - 1);
    inicio = Math.max(1, fin - maxVisible + 1);

    if (inicio > 1) {
        html += `<button class="pagination__btn" onclick="irAPagina(1)">1</button>`;
        if (inicio > 2) html += `<span class="pagination__ellipsis">...</span>`;
    }

    for (let i = inicio; i <= fin; i++) {
        html += `<button class="pagination__btn ${i === data.pagina ? 'pagination__btn--active' : ''}" onclick="irAPagina(${i})">${i}</button>`;
    }

    if (fin < data.paginas_totales) {
        if (fin < data.paginas_totales - 1) html += `<span class="pagination__ellipsis">...</span>`;
        html += `<button class="pagination__btn" onclick="irAPagina(${data.paginas_totales})">${data.paginas_totales}</button>`;
    }

    // Botón siguiente
    html += `<button class="pagination__btn" ${data.pagina >= data.paginas_totales ? 'disabled' : ''} onclick="irAPagina(${data.pagina + 1})">
        <i class="fa-solid fa-chevron-right"></i>
    </button>`;

    pagination.innerHTML = html;
}

function irAPagina(pagina) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => cargarProductos(pagina), 200);
}


filtersToggle?.addEventListener('click', () => {
    filtersSidebar?.classList.add('active');
    filtersOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
});

function cerrarFiltros() {
    filtersSidebar?.classList.remove('active');
    filtersOverlay?.classList.remove('active');
    document.body.style.overflow = '';
}

filtersClose?.addEventListener('click', cerrarFiltros);
filtersOverlay?.addEventListener('click', cerrarFiltros);


function resetearFiltros() {
    if (filterSearch) filterSearch.value = '';
    if (searchClear) searchClear.style.display = 'none';

    document.querySelectorAll('input[name="categoria"]:checked').forEach(cb => cb.checked = false);
    // document.querySelectorAll('input[name="modelo"]:checked').forEach(cb => cb.checked = false);

    const precioMin = document.getElementById('filter-precio-min');
    const precioMax = document.getElementById('filter-precio-max');
    if (precioMin) precioMin.value = precioMinInicial;
    if (precioMax) precioMax.value = precioMaxInicial;

    if (sortSelect) sortSelect.value = 'relevancia';

    contarFiltrosActivos();
    cerrarFiltros();
    cargarProductos(1);
}

filtersReset?.addEventListener('click', resetearFiltros);
filtersClearAll?.addEventListener('click', resetearFiltros);


function initAutoApplyCheckboxes() {
    document.querySelectorAll('input[name="categoria"]').forEach(cb => {
        cb.addEventListener('change', () => {
            contarFiltrosActivos();
            cargarProductos(1);
        });
    });

}


sortSelect?.addEventListener('change', () => {
    cargarProductos(1);
});


filterSearch?.addEventListener('input', () => {
    if (searchClear) {
        searchClear.style.display = filterSearch.value.trim() ? 'flex' : 'none';
    }
    debounce(() => {
        contarFiltrosActivos();
        cargarProductos(1);
    }, 500);
});

filterSearch?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        contarFiltrosActivos();
        cargarProductos(1);
    }
});

searchClear?.addEventListener('click', () => {
    if (filterSearch) filterSearch.value = '';
    searchClear.style.display = 'none';
    contarFiltrosActivos();
    cargarProductos(1);
});


function initPriceAutoApply() {
    const precioMin = document.getElementById('filter-precio-min');
    const precioMax = document.getElementById('filter-precio-max');

    precioMin?.addEventListener('input', () => {
        debounce(() => {
            contarFiltrosActivos();
            cargarProductos(1);
        }, 800);
    });

    precioMax?.addEventListener('input', () => {
        debounce(() => {
            contarFiltrosActivos();
            cargarProductos(1);
        }, 800);
    });

    precioMin?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            contarFiltrosActivos();
            cargarProductos(1);
        }
    });

precioMax?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        contarFiltrosActivos();
        cargarProductos(1);
    }
});
}



filterCategoriaSearch?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const checkboxes = document.querySelectorAll('#categorias-list .filter-checkbox');

    checkboxes.forEach(cb => {
        const label = cb.querySelector('.filter-checkbox__label').textContent.toLowerCase();
        cb.style.display = label.includes(query) ? '' : 'none';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const precioMinEl = document.getElementById('filter-precio-min');
    const precioMaxEl = document.getElementById('filter-precio-max');
    precioMinInicial = precioMinEl?.value || '';
    precioMaxInicial = precioMaxEl?.value || '';

    if (typeof CATALOGO_CONFIG !== 'undefined') {
        if (CATALOGO_CONFIG.busquedaInicial && filterSearch) {
            filterSearch.value = CATALOGO_CONFIG.busquedaInicial;
            if (searchClear) searchClear.style.display = 'flex';
        }
        if (CATALOGO_CONFIG.categoriaActiva) {
            const checkbox = document.querySelector(`input[name="categoria"][value="${CATALOGO_CONFIG.categoriaActiva.slug}"]`);
            if (checkbox) checkbox.checked = true;
        }
    }

    initAccordions();
    initAutoApplyCheckboxes();
    initPriceAutoApply();

    cargarProductos(1);
});
