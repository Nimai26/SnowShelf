/**
 * SnowShelf - Admin Tabs Management
 * Gestion des onglets dans les sections admin
 */

/**
 * Change l'onglet actif
 * @param {string} tabId - ID de l'onglet à activer
 * @param {NodeList} tabs - Liste des éléments d'onglet
 * @param {NodeList} panels - Liste des panneaux
 */
export function switchTab(tabId, tabs, panels) {
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    panels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
}

/**
 * Initialise les événements de navigation par onglets
 * @param {NodeList} tabs - Liste des éléments d'onglet
 * @param {NodeList} panels - Liste des panneaux
 */
export function initTabs(tabs, panels) {
    if (!tabs || tabs.length === 0) {
        console.warn('[Tabs] No tabs found!');
        return;
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab, tabs, panels);
        });
    });
}
