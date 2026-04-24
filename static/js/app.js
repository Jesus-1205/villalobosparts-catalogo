const scrollTopBtn = document.getElementById('scroll-top-btn');

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        scrollTopBtn?.classList.add('visible');
    } else {
        scrollTopBtn?.classList.remove('visible');
    }

    // Header shadow on scroll
    const header = document.getElementById('main-header');
    if (window.scrollY > 10) {
        header?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
    }
});

scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


// MENÚ MÓVIL

const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
let navOverlay = null;

function createNavOverlay() {
    if (!navOverlay) {
        navOverlay = document.createElement('div');
        navOverlay.className = 'nav-overlay';
        document.body.appendChild(navOverlay);
        navOverlay.addEventListener('click', closeMenu);
    }
}

function openMenu() {
    if (document.getElementById('vp-sidebar')) return;
    
    createNavOverlay();
    mainNav?.classList.add('active');
    navOverlay?.classList.add('active');
    menuToggle?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    mainNav?.classList.remove('active');
    navOverlay?.classList.remove('active');
    menuToggle?.classList.remove('active');
    document.body.style.overflow = '';
}

menuToggle?.addEventListener('click', () => {
    if (document.getElementById('vp-sidebar')) return;
    
    if (mainNav?.classList.contains('active')) {
        closeMenu();
    } else {
        openMenu();
    }
});



const categoriasToggle = document.getElementById('categorias-dropdown-toggle');
const categoriasDropdown = document.getElementById('categorias-dropdown');
const categoriasItem = categoriasToggle?.closest('.nav__item--dropdown');

categoriasToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    categoriasItem?.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!categoriasItem?.contains(e.target)) {
        categoriasItem?.classList.remove('active');
    }
});

async function cargarCategoriasNav() {
    try {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();

        if (categoriasDropdown) {
            categoriasDropdown.innerHTML = categorias.map(cat => `
                <li>
                    <a href="/categoria/${cat.slug}">
                        <i class="fa-solid ${cat.icono || 'fa-box'}"></i>
                        ${cat.nombre}
                        <span style="margin-left:auto; font-size:0.7rem; color:var(--gray-400);">(${cat.total_productos})</span>
                    </a>
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

cargarCategoriasNav();



const searchInput = document.getElementById('search-input');
const searchAutocomplete = document.getElementById('search-autocomplete');
let searchTimeout = null;

searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {
        searchAutocomplete?.classList.remove('active');
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
            const resultados = await response.json();

            if (resultados.length > 0) {
                searchAutocomplete.innerHTML = resultados.map(prod => `
                    <a href="/producto/${prod.numero_parte}" class="search-autocomplete__item">
                        <img src="${prod.imagen_url || '/static/img/productos/placeholder.svg'}"
                             alt="${prod.nombre}"
                             class="search-autocomplete__img"
                             onerror="this.src='/static/img/productos/placeholder.svg'">
                        <div class="search-autocomplete__info">
                            <div class="search-autocomplete__name">${prod.nombre}</div>
                            <div class="search-autocomplete__part">${prod.numero_parte}</div>
                        </div>
                        <span class="search-autocomplete__price">$${Number(prod.precio).toFixed(2)}</span>
                    </a>
                `).join('');
                searchAutocomplete.classList.add('active');
            } else {
                searchAutocomplete.innerHTML = `
                    <div class="search-autocomplete__item" style="justify-content: center; color: var(--gray-500);">
                        No se encontraron resultados
                    </div>
                `;
                searchAutocomplete.classList.add('active');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header__search')) {
                searchAutocomplete?.classList.remove('active');
            }
        });

        searchInput?.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && searchAutocomplete?.innerHTML) {
                searchAutocomplete.classList.add('active');
            }
        });


        const heroSearchInput = document.getElementById('hero-search-input');
        const heroSearchAutocomplete = document.getElementById('hero-search-autocomplete');
        let heroSearchTimeout = null;

        heroSearchInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            clearTimeout(heroSearchTimeout);

            if (query.length < 2) {
                heroSearchAutocomplete?.classList.remove('active');
                return;
            }

            heroSearchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
                    const resultados = await response.json();

                    if (heroSearchAutocomplete) {
                        if (resultados.length > 0) {
                            heroSearchAutocomplete.innerHTML = resultados.map(prod => `
                                <a href="/producto/${prod.numero_parte}" class="search-autocomplete__item">
                                    <img src="${prod.imagen_url || '/static/img/productos/placeholder.svg'}"
                                         alt="${prod.nombre}"
                                         class="search-autocomplete__img"
                                         onerror="this.src='/static/img/productos/placeholder.svg'">
                                    <div class="search-autocomplete__info">
                                        <div class="search-autocomplete__name">${prod.nombre}</div>
                                        <div class="search-autocomplete__part">${prod.numero_parte}</div>
                                    </div>
                                    <span class="search-autocomplete__price">$${Number(prod.precio).toFixed(2)}</span>
                                </a>
                            `).join('');
                            heroSearchAutocomplete.classList.add('active');
                        } else {
                            heroSearchAutocomplete.innerHTML = `
                                <div class="search-autocomplete__item" style="justify-content: center; color: var(--gray-500);">
                                    No se encontraron resultados
                                </div>
                            `;
                            heroSearchAutocomplete.classList.add('active');
                        }
                    }
                } catch (error) {
                    console.error('Error en búsqueda del hero:', error);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hero-search-bar')) {
                heroSearchAutocomplete?.classList.remove('active');
            }
        });

        heroSearchInput?.addEventListener('focus', () => {
            if (heroSearchInput.value.trim().length >= 2 && heroSearchAutocomplete?.innerHTML) {
                heroSearchAutocomplete.classList.add('active');
            }
        });


function mostrarToast(titulo, mensaje, tipo = 'success', duracion = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconos = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconos[tipo] || iconos.success} toast__icon"></i>
        <div class="toast__content">
            <div class="toast__title">${titulo}</div>
            ${mensaje ? `<div class="toast__message">${mensaje}</div>` : ''}
        </div>
        <button class="toast__close" onclick="this.closest('.toast').remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}



function formatearPrecio(precio) {
    return `$${Number(precio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
