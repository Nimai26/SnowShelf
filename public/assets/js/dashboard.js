/**
 * SnowShelf - Dashboard JavaScript
 * Gestion du sidebar, menus et interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Chaque fonction est isolée pour éviter qu'une erreur bloque les autres
    try { initSidebar(); } catch(e) { console.error('initSidebar error:', e); }
    try { initUserMenu(); } catch(e) { console.error('initUserMenu error:', e); }
    try { initMobileMenu(); } catch(e) { console.error('initMobileMenu error:', e); }
    try { initSearch(); } catch(e) { console.error('initSearch error:', e); }
    try { initQuickAdd(); } catch(e) { console.error('initQuickAdd error:', e); }
    try { initQuickAddCategory(); } catch(e) { console.error('initQuickAddCategory error:', e); }
});

/**
 * Gestion du Sidebar rétractable
 */
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainWrapper = document.getElementById('mainWrapper');
    
    if (!sidebar || !sidebarToggle) return;
    
    // Charger l'état depuis le localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
    
    // Toggle au clic
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        
        // Sauvegarder l'état
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
    
    // Tooltip sur les icônes quand collapsed
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            if (sidebar.classList.contains('collapsed')) {
                const text = this.querySelector('.nav-text')?.textContent;
                if (text) {
                    this.setAttribute('title', text);
                }
            } else {
                this.removeAttribute('title');
            }
        });
    });
}

/**
 * Gestion du menu utilisateur
 */
function initUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userDropdown = document.getElementById('userDropdown');
    
    if (!userMenu || !userMenuToggle) return;
    
    // Toggle au clic
    userMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenu.classList.toggle('open');
    });
    
    // Fermer si clic en dehors
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('open');
        }
    });
    
    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            userMenu.classList.remove('open');
        }
    });
}

/**
 * Gestion du menu mobile
 */
function initMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !mobileMenuToggle || !sidebarOverlay) return;
    
    // Ouvrir le menu mobile
    mobileMenuToggle.addEventListener('click', function() {
        sidebar.classList.add('mobile-open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Fermer avec l'overlay
    sidebarOverlay.addEventListener('click', function() {
        closeMobileMenu();
    });
    
    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMobileMenu();
        }
    });
    
    function closeMobileMenu() {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Gestion de la recherche
 */
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) return;
    
    // Raccourci clavier Ctrl+K ou Cmd+K
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
    
    // Recherche au submit (à implémenter plus tard)
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                // TODO: Implémenter la recherche
                console.log('Recherche:', query);
            }
        }
    });
}

/**
 * Marquer l'élément de navigation actif
 */
function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const parent = link.closest('.nav-item');
        
        if (currentPath.endsWith(href)) {
            parent?.classList.add('active');
        } else {
            parent?.classList.remove('active');
        }
    });
}

// Appeler au chargement
setActiveNavItem();

/**
 * Gestion du bouton ajout rapide d'item
 */
function initQuickAdd() {
    const quickAddBtn = document.getElementById('quickAddBtn');
    
    if (!quickAddBtn) return;
    
    quickAddBtn.addEventListener('click', function() {
        // Vérifier la page actuelle via le router
        const currentPage = (typeof SnowShelfRouter !== 'undefined' && SnowShelfRouter.getCurrentPage) 
            ? SnowShelfRouter.getCurrentPage() 
            : null;
        
        if (currentPage === 'collection') {
            // On est déjà sur la page collection, ouvrir directement le modal
            if (typeof CollectionPage !== 'undefined' && CollectionPage.openAddItemModal) {
                CollectionPage.openAddItemModal();
            }
        } else {
            // Naviguer vers collection et déclencher l'ouverture du modal après chargement
            window.pendingQuickAdd = true;
            
            if (typeof SnowShelfRouter !== 'undefined' && SnowShelfRouter.navigateTo) {
                SnowShelfRouter.navigateTo('collection');
            } else {
                window.location.href = 'dashboard.php?page=collection';
            }
        }
    });
}

/**
 * Gestion du bouton ajout rapide de catégorie
 */
function initQuickAddCategory() {
    const quickAddCategoryBtn = document.getElementById('quickAddCategoryBtn');
    
    if (!quickAddCategoryBtn) return;
    
    quickAddCategoryBtn.addEventListener('click', function() {
        // Vérifier la page actuelle via le router
        const currentPage = (typeof SnowShelfRouter !== 'undefined' && SnowShelfRouter.getCurrentPage) 
            ? SnowShelfRouter.getCurrentPage() 
            : null;
        
        if (currentPage === 'categories') {
            // On est déjà sur la page catégories, ouvrir directement le modal
            if (typeof SnowShelfCategories !== 'undefined' && SnowShelfCategories.openAddModal) {
                SnowShelfCategories.openAddModal();
            }
        } else {
            // Naviguer vers catégories et déclencher l'ouverture du modal après chargement
            window.pendingQuickAddCategory = true;
            
            if (typeof SnowShelfRouter !== 'undefined' && SnowShelfRouter.navigateTo) {
                SnowShelfRouter.navigateTo('categories');
            } else {
                window.location.href = 'dashboard.php?page=categories';
            }
        }
    });
}
