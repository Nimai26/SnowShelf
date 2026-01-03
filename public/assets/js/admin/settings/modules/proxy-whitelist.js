/**
 * SnowShelf - Admin Proxy Whitelist Module
 * Gestion des domaines autorisés pour le proxy de téléchargement
 * Interface avec textarea (un domaine par ligne) par catégorie
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml } from '/assets/js/admin/core/utils.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Catégories disponibles
const CATEGORIES = ['images', 'audio', 'documents'];

// Éléments DOM
let elements = {};
let domainsData = {}; // { category: [domains] }

/**
 * Initialise le module
 * @param {Object} domElements - Éléments DOM nécessaires
 */
export function initProxyWhitelist(domElements) {
    elements = domElements;
    
    // Écouter les changements dans les textareas
    CATEGORIES.forEach(category => {
        const textarea = document.getElementById(`proxyDomains_${category}`);
        if (textarea) {
            textarea.addEventListener('input', () => updateDomainCount(category));
        }
    });
    
    // Bouton sauvegarder tout
    const saveAllBtn = document.getElementById('saveAllProxyWhitelistBtn');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', saveAllProxyWhitelist);
    }
    
    // Bouton exporter
    const exportBtn = document.getElementById('exportProxyWhitelistBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProxyWhitelist);
    }
}

/**
 * Charge les domaines whitelist depuis la BDD
 */
export async function loadProxyWhitelist() {
    try {
        const response = await fetch(`${CONFIG_API}?table=proxy_whitelist`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const domains = result.data?.items || result.data || [];
            
            // Grouper par catégorie
            domainsData = {};
            CATEGORIES.forEach(cat => domainsData[cat] = []);
            
            domains.forEach(d => {
                const cat = d.category || 'images';
                if (!domainsData[cat]) domainsData[cat] = [];
                domainsData[cat].push({
                    id: d.id,
                    domain: d.domain,
                    description: d.description,
                    is_active: d.is_active == 1 || d.is_active === true || d.is_active === '1'
                });
            });
            
            // Remplir les textareas
            renderWhitelistTextareas();
        }
    } catch (error) {
        console.error('[ProxyWhitelist] Load error:', error);
        showToast('Erreur lors du chargement de la whitelist', 'error');
    }
}

/**
 * Affiche les domaines dans les textareas
 */
function renderWhitelistTextareas() {
    CATEGORIES.forEach(category => {
        const textarea = document.getElementById(`proxyDomains_${category}`);
        if (textarea) {
            // Format: domain [# description] (si inactive, préfixé par #)
            const lines = (domainsData[category] || []).map(d => {
                let line = d.domain;
                if (d.description) {
                    line += ` # ${d.description}`;
                }
                // Si inactif, commenter la ligne
                if (!d.is_active) {
                    line = '# ' + line;
                }
                return line;
            });
            textarea.value = lines.join('\n');
            updateDomainCount(category);
        }
    });
}

/**
 * Met à jour le compteur de domaines pour une catégorie
 * @param {string} category 
 */
function updateDomainCount(category) {
    const textarea = document.getElementById(`proxyDomains_${category}`);
    const countEl = document.getElementById(`proxyCount_${category}`);
    
    if (textarea && countEl) {
        const lines = textarea.value.split('\n').filter(l => {
            const trimmed = l.trim();
            return trimmed && !trimmed.startsWith('#');
        });
        countEl.textContent = `${lines.length} domaine(s) actif(s)`;
    }
}

/**
 * Parse les lignes du textarea en objets domaine
 * @param {string} text - Contenu du textarea
 * @returns {Array} Liste des domaines parsés
 */
function parseDomainsText(text) {
    const lines = text.split('\n');
    const domains = [];
    
    lines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed) return;
        
        let is_active = true;
        let description = '';
        
        // Vérifier si commenté (inactif)
        if (trimmed.startsWith('#')) {
            is_active = false;
            trimmed = trimmed.substring(1).trim();
        }
        
        if (!trimmed) return;
        
        // Extraire description après # (séparé par espace + #)
        const parts = trimmed.split(/\s+#\s*/);
        if (parts.length > 1) {
            description = parts.slice(1).join(' ').trim();
            trimmed = parts[0].trim();
        }
        
        // Nettoyer le domaine : retirer protocole et chemin si présent
        let domain = trimmed
            .replace(/^https?:\/\//i, '')  // Retirer http:// ou https://
            .replace(/\/.*$/, '')           // Retirer tout après le premier /
            .toLowerCase()
            .trim();
        
        // Valider le domaine (plus permissif pour sous-domaines)
        if (domain && /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(domain)) {
            domains.push({
                domain: domain,
                description: description,
                is_active: is_active
            });
        }
    });
    
    return domains;
}

/**
 * Sauvegarde tous les domaines d'une catégorie
 * @param {string} category 
 */
export async function saveProxyCategory(category) {
    const textarea = document.getElementById(`proxyDomains_${category}`);
    if (!textarea) return;
    
    const newDomains = parseDomainsText(textarea.value);
    const oldDomains = domainsData[category] || [];
    
    showLoading(true);
    
    try {
        // Trouver les domaines à supprimer (présents dans old mais pas dans new)
        const newDomainNames = new Set(newDomains.map(d => d.domain));
        const toDelete = oldDomains.filter(d => !newDomainNames.has(d.domain));
        
        // Trouver les domaines à ajouter ou mettre à jour
        const oldDomainMap = new Map(oldDomains.map(d => [d.domain, d]));
        
        const errors = [];
        let successCount = 0;
        
        // Supprimer les domaines retirés
        for (const d of toDelete) {
            try {
                const resp = await fetch(`${CONFIG_API}?table=proxy_whitelist&id=${d.id}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                if (resp.ok) successCount++;
            } catch (e) {
                errors.push(`Erreur suppression ${d.domain}`);
            }
        }
        
        // Ajouter ou mettre à jour les domaines
        for (const newD of newDomains) {
            const existing = oldDomainMap.get(newD.domain);
            
            if (existing) {
                // Mise à jour si changement
                if (existing.description !== newD.description || existing.is_active !== newD.is_active) {
                    try {
                        const resp = await fetch(`${CONFIG_API}?table=proxy_whitelist&id=${existing.id}`, {
                            method: 'PUT',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                domain: newD.domain,
                                category: category,
                                description: newD.description,
                                is_active: newD.is_active ? 1 : 0
                            })
                        });
                        if (resp.ok) successCount++;
                    } catch (e) {
                        errors.push(`Erreur MAJ ${newD.domain}`);
                    }
                }
            } else {
                // Ajout nouveau domaine
                try {
                    const resp = await fetch(`${CONFIG_API}?table=proxy_whitelist`, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            domain: newD.domain,
                            category: category,
                            description: newD.description,
                            is_active: newD.is_active ? 1 : 0
                        })
                    });
                    const result = await resp.json();
                    if (resp.ok && result.success) {
                        successCount++;
                    } else {
                        errors.push(`${newD.domain}: ${result.message || 'Erreur'}`);
                    }
                } catch (e) {
                    errors.push(`Erreur ajout ${newD.domain}`);
                }
            }
        }
        
        if (errors.length > 0) {
            showToast(`${errors.length} erreur(s): ${errors[0]}`, 'warning');
        } else {
            showToast('Whitelist mise à jour avec succès', 'success');
        }
        
        // Recharger les données
        await loadProxyWhitelist();
        
    } catch (error) {
        console.error('[ProxyWhitelist] Save error:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Sauvegarde toutes les catégories
 */
export async function saveAllProxyWhitelist() {
    showLoading(true);
    
    try {
        for (const category of CATEGORIES) {
            await saveProxyCategory(category);
        }
        showToast('Toutes les catégories ont été sauvegardées', 'success');
    } catch (error) {
        console.error('[ProxyWhitelist] Save all error:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Exporte les domaines (pour backup)
 */
export function exportProxyWhitelist() {
    const allDomains = [];
    CATEGORIES.forEach(cat => {
        (domainsData[cat] || []).forEach(d => {
            allDomains.push({
                domain: d.domain,
                category: cat,
                description: d.description || '',
                is_active: d.is_active
            });
        });
    });
    
    const json = JSON.stringify(allDomains, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxy_whitelist_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Whitelist exportée', 'success');
}

// Export des fonctions pour le panel global
export default {
    initProxyWhitelist,
    loadProxyWhitelist,
    saveProxyCategory,
    saveAllProxyWhitelist,
    exportProxyWhitelist
};
