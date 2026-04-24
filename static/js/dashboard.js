var API_BASE = API_BASE || '/api/admin';

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// API helpers
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('API Error Response:', data);
            throw new Error(data.detail || JSON.stringify(data) || 'Error en la solicitud');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
});

// Toggle (for switches)
function initToggles() {
    document.querySelectorAll('.toggle').forEach(toggle => {
        const input = toggle.querySelector('input');
        const hiddenInput = toggle.querySelector('input[type="hidden"]');
        
        if (input) {
            input.addEventListener('change', async () => {
                const isChecked = input.checked;
                const endpoint = toggle.dataset.endpoint;
                const field = toggle.dataset.field;
                
                if (endpoint) {
                    try {
                        await apiRequest(endpoint, {
                            method: 'PUT',
                            body: JSON.stringify({ [field]: isChecked }),
                        });
                        showToast('Actualizado correctamente');
                    } catch (error) {
                        input.checked = !isChecked;
                    }
                }
            });
        }
    });
}

// Select All checkbox
function initSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
        });
    }
}

// Delete confirmation
async function confirmDelete(endpoint, message = '¿Estás seguro?') {
    if (confirm(message)) {
        try {
            await apiRequest(endpoint, { method: 'DELETE' });
            showToast('Eliminado correctamente');
            return true;
        } catch (error) {
            return false;
        }
    }
    return false;
}

// Pagination
function renderPagination(paginationData, onPageChange) {
    const { pagina, paginas_totales, tiene_anterior, tiene_siguiente } = paginationData;
    
    let html = `
        <button class="pagination-btn" ${!tiene_anterior ? 'disabled' : ''} onclick="${onPageChange(pagina - 1)}">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;
    
    for (let i = Math.max(1, pagina - 2); i <= Math.min(paginas_totales, pagina + 2); i++) {
        html += `
            <button class="pagination-btn ${i === pagina ? 'active' : ''}" onclick="${onPageChange(i)}">
                ${i}
            </button>
        `;
    }
    
    html += `
        <button class="pagination-btn" ${!tiene_siguiente ? 'disabled' : ''} onclick="${onPageChange(pagina + 1)}">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;
    
    return html;
}

// Search with debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initToggles();
    initSelectAll();
});

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/dashboard/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/dashboard/login';
    }
}

// Export functions
window.dashboard = {
    apiRequest,
    showToast,
    openModal,
    closeModal,
    confirmDelete,
    debounce,
    logout,
};