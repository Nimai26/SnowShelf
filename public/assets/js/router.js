/**
 * SnowShelf - SPA Router
 * Gestion de la navigation dynamique sans rechargement de page
 */

const SnowShelfRouter = (function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const config = {
        contentContainer: '#pageContent',
        loadingClass: 'loading',
        activeNavClass: 'active',
        apiEndpoint: 'api/pages.php',
        defaultPage: 'home',
        transitionDuration: 200
    };

    // Pages disponibles avec leurs configurations
    const pages = {
        'home': {
            title: 'Accueil',
            scripts: []
        },
        'account': {
            title: 'Mon compte',
            scripts: ['assets/js/account.js'],
            onLoad: function() {
                // Réinitialiser le module account si déjà chargé
                if (window.SnowShelfAccount && typeof window.SnowShelfAccount.init === 'function') {
                    window.SnowShelfAccount.init();
                }
            }
        },
        'collection': {
            title: 'Ma collection',
            scripts: [],
            onLoad: function() {
                // Initialiser le module collection
                if (window.CollectionPage && typeof window.CollectionPage.init === 'function') {
                    window.CollectionPage.init();
                }
            },
            onUnload: function() {
                // Nettoyer les ressources du module collection
                if (window.CollectionPage && typeof window.CollectionPage.destroy === 'function') {
                    window.CollectionPage.destroy();
                }
            }
        },
        'categories': {
            title: 'Catégories',
            scripts: ['assets/js/categories.js'],
            css: ['assets/css/categories.css?v=' + Date.now()],
            onLoad: function() {
                // Réinitialiser le module categories si déjà chargé
                if (window.SnowShelfCategories && typeof window.SnowShelfCategories.init === 'function') {
                    window.SnowShelfCategories.init();
                }
            }
        },
        'scan': {
            title: 'Scanner',
            scripts: []
        },
        'wishlist': {
            title: 'Liste de souhaits',
            scripts: []
        },
        'explore': {
            title: 'Explorer',
            scripts: []
        },
        'community': {
            title: 'Communauté',
            scripts: []
        },
        'stats': {
            title: 'Statistiques',
            scripts: []
        }
    };

    // État du router
    let currentPage = null;
    let isLoading = false;
    let loadedScripts = new Set();
    let loadedStyles = new Set();

    // ========================================
    // Initialisation
    // ========================================
    function init() {
        // Écouter les clics sur les liens de navigation
        document.addEventListener('click', handleLinkClick);
        
        // Écouter les changements d'historique (bouton retour/avant)
        window.addEventListener('popstate', handlePopState);
        
        // Charger la page initiale basée sur l'URL
        const initialPage = getPageFromUrl();
        loadPage(initialPage, false);
    }

    // ========================================
    // Gestion des événements
    // ========================================
    function handleLinkClick(e) {
        // Liens avec data-page (navigation, boutons, etc.)
        const link = e.target.closest('[data-page]');
        if (link) {
            const pageName = link.dataset.page;
            if (pageName && pages[pageName]) {
                e.preventDefault();
                navigateTo(pageName);
                return;
            }
        }
        
        // Liens de navigation classiques
        const navLink = e.target.closest('a.nav-link, a.dropdown-item');
        if (!navLink) return;
        
        // Ignorer les liens externes, logout, admin
        const href = navLink.getAttribute('href');
        if (!href || 
            href.startsWith('http') || 
            href.startsWith('auth/') || 
            href.startsWith('admin/') ||
            href === '#') {
            return;
        }
        
        // Extraire le nom de la page depuis data-page ou href
        let pageName = navLink.dataset.page;
        if (!pageName) {
            // Extraire depuis le href (ex: "dashboard.php?page=account" -> "account")
            const urlParams = new URLSearchParams(href.split('?')[1] || '');
            pageName = urlParams.get('page') || 'home';
        }
        
        // Vérifier si c'est une page valide
        if (!pages[pageName]) {
            // Laisser le comportement par défaut pour les pages non gérées
            return;
        }
        
        e.preventDefault();
        navigateTo(pageName);
    }

    function handlePopState(e) {
        const pageName = e.state?.page || getPageFromUrl();
        if (pageName) {
            loadPage(pageName, false);
        }
    }

    // ========================================
    // Navigation
    // ========================================
    function navigateTo(pageName, pushState = true) {
        if (pageName === currentPage || isLoading) return;
        
        // Construire l'URL
        const url = pageName === 'home' ? 'dashboard.php' : `dashboard.php?page=${pageName}`;
        
        // Mettre à jour l'historique
        if (pushState) {
            history.pushState({ page: pageName }, '', url);
        }
        
        // Charger la page
        loadPage(pageName);
    }

    async function loadPage(pageName, animate = true) {
        if (isLoading) return;
        isLoading = true;
        
        // Appeler onUnload de la page actuelle si elle existe
        if (currentPage && pages[currentPage] && typeof pages[currentPage].onUnload === 'function') {
            try {
                pages[currentPage].onUnload();
            } catch (e) {
                console.warn('[Router] Error in onUnload for page:', currentPage, e);
            }
        }
        
        const container = document.querySelector(config.contentContainer);
        if (!container) {
            console.error('[Router] Content container not found:', config.contentContainer);
            isLoading = false;
            return;
        }
        
        // Animation de sortie
        if (animate) {
            container.classList.add(config.loadingClass);
            await sleep(config.transitionDuration);
        }
        
        try {
            // Charger le contenu via l'API
            const response = await fetch(`${config.apiEndpoint}?page=${pageName}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erreur lors du chargement');
            }
            
            // Injecter le HTML
            container.innerHTML = data.html;
            
            // Exécuter les scripts inline présents dans le HTML injecté
            executeInlineScriptsFromContainer(container);
            
            // Charger les CSS nécessaires (depuis l'API)
            if (data.css && data.css.length > 0) {
                await loadStyles(data.css);
            }
            
            // Charger les CSS depuis la config locale si définis
            const pageConfig = pages[pageName];
            if (pageConfig && pageConfig.css && pageConfig.css.length > 0) {
                await loadStyles(pageConfig.css);
            }
            
            // Charger les scripts de la page (depuis la config locale, pas l'API)
            if (pageConfig && pageConfig.scripts && pageConfig.scripts.length > 0) {
                await loadScripts(pageConfig.scripts);
            }
            
            // Exécuter le callback onLoad si défini
            if (pageConfig && typeof pageConfig.onLoad === 'function') {
                pageConfig.onLoad();
            }
            
            // Exécuter le script inline si présent
            if (data.inlineScript) {
                executeInlineScript(data.inlineScript);
            }
            
            // Mettre à jour le titre
            if (data.title) {
                document.title = `SnowShelf - ${data.title}`;
            }
            
            // Mettre à jour la navigation active
            updateActiveNav(pageName);
            
            // Mettre à jour la page courante
            currentPage = pageName;
            
            // Émettre un événement pour les autres scripts
            document.dispatchEvent(new CustomEvent('pageLoaded', { 
                detail: { page: pageName, data: data } 
            }));
            
        } catch (error) {
            console.error('[Router] Error loading page:', error);
            container.innerHTML = `
                <div class="error-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h2>Erreur de chargement</h2>
                    <p>${error.message}</p>
                    <button onclick="SnowShelfRouter.reload()" class="btn btn-primary">Réessayer</button>
                </div>
            `;
        } finally {
            // Animation d'entrée
            if (animate) {
                container.classList.remove(config.loadingClass);
            }
            isLoading = false;
        }
    }

    // ========================================
    // Chargement des ressources
    // ========================================
    async function loadStyles(stylesheets) {
        const promises = stylesheets.map(href => {
            // Extraire le chemin de base (sans query string) pour la vérification du cache
            const basePath = href.split('?')[0];
            if (loadedStyles.has(basePath)) {
                return Promise.resolve();
            }
            
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = () => {
                    loadedStyles.add(basePath);
                    resolve();
                };
                link.onerror = reject;
                document.head.appendChild(link);
            });
        });
        
        await Promise.all(promises);
    }

    async function loadScripts(scripts) {
        for (const src of scripts) {
            if (loadedScripts.has(src)) {
                continue;
            }
            
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedScripts.add(src);
                    resolve();
                };
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }
    }

    function executeInlineScript(code) {
        try {
            const fn = new Function(code);
            fn();
        } catch (error) {
            console.error('[Router] Error executing inline script:', error);
        }
    }

    /**
     * Exécute les scripts inline présents dans un conteneur
     * Les balises <script> injectées via innerHTML ne s'exécutent pas automatiquement
     */
    function executeInlineScriptsFromContainer(container) {
        const scripts = container.querySelectorAll('script');
        
        scripts.forEach((script) => {
            // Ignorer les scripts avec src (ils seront chargés autrement)
            if (script.src) return;
            
            try {
                // Créer et exécuter le script
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.head.appendChild(newScript);
                // Nettoyer immédiatement
                document.head.removeChild(newScript);
            } catch (error) {
                console.error('[Router] Error executing inline script from container:', error);
            }
        });
    }

    // ========================================
    // Helpers
    // ========================================
    function getPageFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('page') || 'home';
    }

    function updateActiveNav(pageName) {
        // Retirer la classe active de tous les éléments
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove(config.activeNavClass);
        });
        
        // Trouver et marquer l'élément actif
        let selector;
        if (pageName === 'home') {
            selector = '.nav-link[href="dashboard.php"]';
        } else {
            selector = `.nav-link[href="${pageName}.php"], .nav-link[data-page="${pageName}"]`;
        }
        
        const activeLink = document.querySelector(selector);
        if (activeLink) {
            activeLink.closest('.nav-item')?.classList.add(config.activeNavClass);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function reload() {
        if (currentPage) {
            loadPage(currentPage);
        }
    }

    function getCurrentPage() {
        return currentPage;
    }

    // ========================================
    // API publique
    // ========================================
    return {
        init,
        navigateTo,
        reload,
        getCurrentPage
    };
})();

// Initialiser le router quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    SnowShelfRouter.init();
});
