const sidebar = document.getElementById('vp-sidebar');
    const overlay = document.getElementById('vp-sidebar-overlay');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const catToggle = document.getElementById('sidebar-cat-toggle');
    const catSubmenu = document.getElementById('sidebar-cat-submenu');
    const catDropdown = document.getElementById('sidebar-cat-dropdown');

    // Buscador con autocompletado
    const sidebarSearchInput = document.getElementById('sidebar-search-input');
    const sidebarSearchAutocomplete = document.getElementById('sidebar-search-autocomplete');
    let sidebarSearchTimeout = null;

    if (!sidebar) return;


    collapseBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');

        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('vp_sidebar_collapsed', isCollapsed);

        if (isCollapsed) {
            closeAllSubmenus();
        }
    });

    const savedState = localStorage.getItem('vp_sidebar_collapsed');
    if (savedState === 'true' && window.innerWidth > 1024) {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }

    menuToggle?.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            e.stopPropagation();
            toggleMobileSidebar();
        }
    });

    function toggleMobileSidebar() {
        const isOpen = sidebar.classList.contains('mobile-open');
        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }

    function openMobileSidebar() {
        sidebar.classList.add('mobile-open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        menuToggle?.classList.add('active');
    }

    function closeMobileSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle?.classList.remove('active');
    }

    overlay?.addEventListener('click', closeMobileSidebar);

    catToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (sidebar.classList.contains('collapsed') && window.innerWidth > 1024) {
            window.location.href = '/catalogo';
            return;
        }

        const isOpen = catDropdown.classList.toggle('open');

        if (isOpen && catSubmenu) {
            catSubmenu.style.height = catSubmenu.scrollHeight + 'px';
        } else if (catSubmenu) {
            catSubmenu.style.height = '0';
        }
    });

    function closeAllSubmenus() {
        document.querySelectorAll('.vp-sidebar__item--dropdown.open').forEach(item => {
            item.classList.remove('open');
            const sub = item.querySelector('.vp-sidebar__submenu');
            if (sub) sub.style.height = '0';
        });
    }

    async function cargarCategoriasSidebar() {
        try {
            const response = await fetch('/api/categorias');
            const categorias = await response.json();

            if (catSubmenu) {
                catSubmenu.innerHTML = categorias.map(cat => `
                    <li>
                        <a href="/categoria/${cat.slug}">
                            <i class="fa-solid ${cat.icono || 'fa-box'}"></i>
                            <span>${cat.nombre}</span>
                        </a>
                    </li>
                `).join('');
            }
        } catch (error) {
            console.error('Error cargando categorías en sidebar:', error);
        }
    }

    cargarCategoriasSidebar();

    sidebarSearchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        clearTimeout(sidebarSearchTimeout);

        if (query.length < 2) {
            sidebarSearchAutocomplete?.classList.remove('active');
            return;
        }

        sidebarSearchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
                const resultados = await response.json();

                if (sidebarSearchAutocomplete) {
                    if (resultados.length > 0) {
                        sidebarSearchAutocomplete.innerHTML = resultados.map(prod => `
                            <a href="/producto/${prod.numero_parte}" class="search-autocomplete__item">
                                <img src="${prod.imagen_url || '/static/img/productos/placeholder.svg'}"
                                     alt="${prod.nombre}"
                                     class="search-autocomplete__img"
                                     onerror="this.src='/static/img/productos/placeholder.svg'">
                                <div class="search-autocomplete__info">
                                    <div class="search-autocomplete__name">${prod.nombre}</div>
                                    <div class="search-autocomplete__part">${prod.numero_parte}</div>
                                </div>
                                <span class="search-autocomplete__price">${typeof formatearPrecio === 'function' ? formatearPrecio(prod.precio) : `$${Number(prod.precio).toFixed(2)}`}</span>
                            </a>
                        `).join('');
                        sidebarSearchAutocomplete.classList.add('active');
                    } else {
                        sidebarSearchAutocomplete.innerHTML = `
                            <div class="search-autocomplete__item" style="justify-content: center; color: var(--gray-500);">
                                No se encontraron resultados
                            </div>
                        `;
                        sidebarSearchAutocomplete.classList.add('active');
                    }
                }
            } catch (error) {
                console.error('Error en búsqueda del sidebar:', error);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.vp-sidebar__search')) {
            sidebarSearchAutocomplete?.classList.remove('active');
        }
    });

    sidebarSearchInput?.addEventListener('focus', () => {
        if (sidebarSearchInput.value.trim().length >= 2 && sidebarSearchAutocomplete?.innerHTML) {
            sidebarSearchAutocomplete.classList.add('active');
        }
    });

    function actualizarBadgeSidebar() {
        const badge = document.getElementById('sidebar-cart-badge');
        if (badge && typeof obtenerTotalesCarrito === 'function') {
            const totales = obtenerTotalesCarrito();
            badge.textContent = totales.unidades;
            badge.style.display = totales.unidades > 0 ? 'flex' : 'none';
        }
    }

    const originalGuardarCarrito = window.guardarCarrito;
    if (typeof originalGuardarCarrito === 'function') {
        window.guardarCarrito = function(items) {
            originalGuardarCarrito(items);
            actualizarBadgeSidebar();
        };
    }

    actualizarBadgeSidebar();

    function setTooltips() {
        document.querySelectorAll('.vp-sidebar__link').forEach(link => {
            const span = link.querySelector('span');
            if (span) {
                link.setAttribute('data-tooltip', span.textContent.trim());
            }
        });
    }
    setTooltips();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 1024) {
                closeMobileSidebar();
                sidebar.classList.remove('mobile-open');
            } else {
                sidebar.classList.remove('collapsed');
                document.body.classList.remove('sidebar-collapsed');
            }
        }, 150);
    });

    document.querySelectorAll('.vp-sidebar__link[href], .vp-sidebar__submenu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                setTimeout(closeMobileSidebar, 150);
            }
        });
    });
});
