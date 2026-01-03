/**
 * SnowShelf - Web Search Module
 * Utilitaires généraux (helpers)
 */

/**
 * Échapper les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Afficher un toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type de toast (info, success, warning, error)
 */
export function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`[Toast ${type}] ${message}`);
    }
}

/**
 * Helper pour récupérer une traduction avec fallback
 * @param {string} key - Clé de traduction
 * @param {string} fallback - Valeur par défaut
 * @returns {string} - Traduction ou fallback
 */
export function __(key, fallback) {
    if (typeof window.__ === 'function') {
        const translated = window.__(key);
        if (translated && translated !== key && !translated.startsWith('web_search.')) {
            return translated;
        }
    }
    return fallback;
}

/**
 * Récupérer toutes les traductions du module
 * @returns {Object} - Objet avec toutes les traductions
 */
export function getTranslations() {
    return {
        title: __('web_search.title', 'Recherche Web'),
        type_label: __('web_search.type_label', 'Type de contenu'),
        providers_label: __('web_search.providers_label', 'Fournisseurs'),
        text_search_label: __('web_search.text_search_label', 'Recherche textuelle'),
        text_search_placeholder: __('web_search.text_search_placeholder', 'Nom, titre, description...'),
        search_btn: __('web_search.search_btn', 'Rechercher'),
        stop_btn: __('web_search.stop_btn', 'Arrêter'),
        image_search_label: __('web_search.image_search_label', 'Recherche par image'),
        image_drop_hint: __('web_search.image_drop_hint', 'Glissez une image ou cliquez'),
        browse_file: __('web_search.browse_file', 'Parcourir'),
        camera_btn: __('web_search.camera_btn', 'Photo'),
        camera_btn_title: __('web_search.camera_btn_title', 'Prendre une photo pour reconnaissance'),
        scan_btn: __('web_search.scan_btn', 'Scan'),
        scan_btn_title: __('web_search.scan_btn_title', 'Scanner un code-barres'),
        use_local_db_label: __('web_search.use_local_db_label', 'Utiliser la BDD SnowShelf'),
        use_local_db_tooltip: __('web_search.use_local_db_tooltip', 'Utilise les données en cache. Désactiver pour forcer une recherche fraîche depuis les sources externes'),
        auto_translate_label: __('web_search.auto_translate_label', 'Auto-traduction'),
        auto_translate_tooltip: __('web_search.auto_translate_tooltip', 'Si la réponse n\'est pas disponible dans votre langue, une traduction automatique sera effectuée'),
        auto_translate_premium_hint: __('web_search.auto_translate_premium_hint', 'Fonctionnalité réservée aux utilisateurs Premium'),
        search_image_btn: __('web_search.search_image_btn', 'Rechercher'),
        results_title: __('web_search.results_title', 'Résultats'),
        no_results_yet: __('web_search.no_results_yet', 'Lancez une recherche pour voir les résultats'),
        no_results: __('web_search.no_results', 'Aucun résultat trouvé'),
        searching: __('web_search.searching', 'Recherche en cours...'),
        results_found: __('web_search.results_found', 'résultat(s)'),
        select_result: __('web_search.select_result', 'Sélectionner'),
        view_source: __('web_search.view_source', 'Voir la source'),
        close: __('web_search.close', 'Fermer'),
        supports_barcode: __('web_search.supports_barcode', 'Supporte les codes-barres'),
        no_providers: __('web_search.no_providers', 'Aucun fournisseur disponible pour ce type'),
        error_loading: __('web_search.error_loading', 'Erreur de chargement des fournisseurs'),
        error_empty_query: __('web_search.error_empty_query', 'Veuillez saisir un texte de recherche'),
        error_no_provider: __('web_search.error_no_provider', 'Veuillez sélectionner au moins un fournisseur'),
        error_no_image: __('web_search.error_no_image', 'Veuillez sélectionner une image'),
        error_invalid_image: __('web_search.error_invalid_image', 'Format d\'image invalide'),
        error_search: __('web_search.error_search', 'Erreur lors de la recherche'),
        search_cancelled: __('web_search.search_cancelled', 'Recherche annulée'),
        result_selected: __('web_search.result_selected', 'Résultat sélectionné'),
        image_search_coming_soon: __('web_search.image_search_coming_soon', 'Recherche par image bientôt disponible'),
        camera_not_available: __('web_search.camera_not_available', 'Caméra non disponible'),
        barcode_not_detected: __('web_search.barcode_not_detected', 'Aucun code-barres détecté sur l\'image'),
        premium_only_provider: __('web_search.premium_only_provider', 'Fournisseur réservé aux utilisateurs Premium'),
        // Modal détails et import
        detail_title: __('web_search.detail_title', 'Détails du résultat'),
        detail_import_as: __('web_search.detail_import_as', 'Importer comme'),
        detail_select_type: __('web_search.detail_select_type', 'Choisir le type'),
        detail_select_fields: __('web_search.detail_select_fields', 'Sélectionner les champs à importer'),
        detail_select_all: __('web_search.detail_select_all', 'Tout'),
        detail_select_none: __('web_search.detail_select_none', 'Rien'),
        detail_import_btn: __('web_search.detail_import_btn', 'Importer la sélection'),
        detail_cancel_btn: __('web_search.detail_cancel_btn', 'Annuler'),
        detail_view_source: __('web_search.detail_view_source', 'Voir sur le site'),
        detail_no_metadata: __('web_search.detail_no_metadata', 'Aucune métadonnée disponible'),
        detail_no_description: __('web_search.detail_no_description', 'Pas de description disponible'),
        detail_metadata_section: __('web_search.detail_metadata_section', 'Métadonnées'),
        detail_import_section: __('web_search.detail_import_section', 'Options d\'import'),
        detail_field_name: __('web_search.detail_field_name', 'Nom suggéré'),
        detail_field_description: __('web_search.detail_field_description', 'Description'),
        detail_field_image: __('web_search.detail_field_image', 'Image'),
        detail_field_images: __('web_search.detail_field_images', 'Images'),
        detail_field_price: __('web_search.detail_field_price', 'Valeur marchande'),
        detail_field_barcode: __('web_search.detail_field_barcode', 'Code-barres'),
        detail_field_videos: __('web_search.detail_field_videos', 'Vidéos'),
        detail_field_audio: __('web_search.detail_field_audio', 'Audio'),
        detail_field_documents: __('web_search.detail_field_documents', 'Documents / Manuels'),
        detail_general_fields: __('web_search.detail_general_fields', 'Informations générales'),
        detail_media_fields: __('web_search.detail_media_fields', 'Médias'),
        detail_type_fields: __('web_search.detail_type_fields', 'Détails spécifiques'),
        detail_no_media: __('web_search.detail_no_media', 'Aucun média disponible'),
        detail_no_type_fields: __('web_search.detail_no_type_fields', 'Aucun champ spécifique pour ce type'),
        detail_import_success: __('web_search.detail_import_success', 'Données importées avec succès'),
        detail_import_error: __('web_search.detail_import_error', 'Erreur lors de l\'import'),
        detail_importing: __('web_search.detail_importing', 'Import en cours...'),
        detail_no_field_selected: __('web_search.detail_no_field_selected', 'Veuillez sélectionner au moins un champ à importer'),
        // Bouton charger les détails
        detail_load_more: __('web_search.detail_load_more', 'Plus de détails'),
        detail_load_more_title: __('web_search.detail_load_more_title', 'Charger les informations complètes depuis le fournisseur'),
        detail_loading: __('web_search.detail_loading', 'Chargement...'),
        detail_loaded: __('web_search.detail_loaded', 'Détails chargés'),
        detail_loaded_success: __('web_search.detail_loaded_success', 'Détails chargés avec succès'),
        detail_load_error: __('web_search.detail_load_error', 'Erreur lors du chargement des détails'),
        // Images et manuels
        detail_images_hint: __('web_search.detail_images_hint', 'Clic = voir, Double-clic = sélectionner'),
        detail_images_selected: __('web_search.detail_images_selected', 'sélectionnée(s)'),
        detail_select_all_images: __('web_search.detail_select_all_images', 'Tout sélectionner'),
        detail_deselect_all_images: __('web_search.detail_deselect_all_images', 'Tout désélectionner'),
        detail_instructions_section: __('web_search.detail_instructions_section', 'Manuels d\'instructions'),
        detail_selected: __('web_search.detail_selected', 'sélectionné(s)'),
        detail_view_pdf: __('web_search.detail_view_pdf', 'Voir le PDF'),
        detail_deselect_all: __('web_search.detail_deselect_all', 'Tout désélectionner'),
    };
}

/**
 * Récupérer une traduction spécifique
 * @param {string} key - Clé de traduction
 * @returns {string} - Traduction
 */
export function getTranslation(key) {
    return getTranslations()[key] || key;
}

/**
 * Formater le label d'une métadonnée avec traduction
 * @param {string} key - Clé du champ
 * @returns {string} - Label formaté
 */
export function formatMetadataLabel(key) {
    const labelTranslations = {
        'year': window.__?.('metadata.year'),
        'rating': window.__?.('metadata.rating'),
        'price': window.__?.('metadata.price'),
        'availability': window.__?.('metadata.availability'),
        'reviews_count': window.__?.('metadata.reviews_count'),
        'set_number': window.__?.('metadata.set_number'),
        'brand': window.__?.('metadata.brand'),
        'pieces': window.__?.('metadata.pieces'),
        'unique_parts': window.__?.('metadata.unique_parts'),
        'minifigs': window.__?.('metadata.minifigs'),
        'minifigs_list': window.__?.('metadata.minifigs_list'),
        'theme': window.__?.('metadata.theme'),
        'theme_id': window.__?.('metadata.theme_id'),
        'subtheme': window.__?.('metadata.subtheme'),
        'age_range': window.__?.('metadata.age_range'),
        'dimensions': window.__?.('metadata.dimensions'),
        'weight': window.__?.('metadata.weight'),
        'designer': window.__?.('metadata.designer'),
        'difficulty': window.__?.('metadata.difficulty'),
        'vip_points': window.__?.('metadata.vip_points'),
        'instructions_url': window.__?.('metadata.instructions_url'),
        'instructions': window.__?.('metadata.instructions'),
        'instructions_count': window.__?.('metadata.instructions_count'),
        'rebrickable_id': window.__?.('metadata.rebrickable_id'),
        'parts_count': window.__?.('metadata.parts_count'),
        'authors': window.__?.('metadata.authors'),
        'author': window.__?.('metadata.author'),
        'isbn': window.__?.('metadata.isbn'),
        'isbn_10': window.__?.('metadata.isbn'),
        'isbn_13': window.__?.('metadata.isbn'),
        'pages': window.__?.('metadata.pages'),
        'publisher': window.__?.('metadata.publisher'),
        'language': window.__?.('metadata.language'),
        'platforms': window.__?.('metadata.platforms'),
        'platform': window.__?.('metadata.platform'),
        'developer': window.__?.('metadata.developer'),
        'developers': window.__?.('metadata.developers'),
        'publishers': window.__?.('metadata.publishers'),
        'release_date': window.__?.('metadata.release_date'),
        'genres': window.__?.('metadata.genres'),
        'genre': window.__?.('metadata.genre'),
        'metacritic': window.__?.('metadata.metacritic'),
        'playtime': window.__?.('metadata.playtime'),
        'esrb_rating': window.__?.('metadata.esrb_rating'),
        'runtime': window.__?.('metadata.runtime'),
        'duration': window.__?.('metadata.duration'),
        'director': window.__?.('metadata.director'),
        'episodes': window.__?.('metadata.episodes'),
        'seasons': window.__?.('metadata.seasons'),
        'media_type': window.__?.('metadata.media_type'),
        'votes': window.__?.('metadata.votes'),
        'tagline': window.__?.('metadata.tagline'),
        'budget': window.__?.('metadata.budget'),
        'revenue': window.__?.('metadata.revenue'),
        'status': window.__?.('metadata.status'),
        'original_language': window.__?.('metadata.original_language'),
        'production_companies': window.__?.('metadata.production_companies'),
        'networks': window.__?.('metadata.networks'),
        'artist': window.__?.('metadata.artist'),
        'album': window.__?.('metadata.album'),
        'track_count': window.__?.('metadata.track_count'),
        'tracks': window.__?.('metadata.tracks'),
        'category': window.__?.('metadata.category'),
        'collection': window.__?.('metadata.collection'),
        'series': window.__?.('metadata.series'),
        'condition': window.__?.('metadata.condition'),
        'barcode': window.__?.('metadata.barcode'),
        'barcode_type': window.__?.('metadata.barcode_type'),
        'total_stickers': window.__?.('metadata.total_stickers'),
        'special_stickers': window.__?.('metadata.special_stickers'),
        'checklist': window.__?.('metadata.checklist'),
    };
    
    const translated = labelTranslations[key];
    if (translated && translated !== `metadata.${key}`) {
        return translated;
    }
    
    // Fallback : formater la clé
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formater la valeur d'une métadonnée pour l'affichage
 * @param {string} key - Clé du champ
 * @param {*} value - Valeur à formater
 * @returns {string} - Valeur formatée
 */
export function formatMetadataValue(key, value) {
    if (value === null || value === undefined) return '-';
    
    if (Array.isArray(value)) {
        // Gérer les tableaux d'objets (ex: plateformes {id, name})
        return value.map(v => {
            if (typeof v === 'object' && v !== null) {
                return v.name || v.label || v.title || v.value || String(v);
            }
            return String(v);
        }).join(', ');
    }
    
    if (typeof value === 'object') {
        // Essayer d'extraire un nom lisible de l'objet
        return value.name || value.label || value.title || value.value || '-';
    }
    
    switch (key) {
        case 'price':
            return String(value);
        case 'year':
        case 'pieces':
        case 'minifigs':
        case 'unique_parts':
        case 'parts_count':
        case 'pages':
        case 'episodes':
        case 'seasons':
        case 'instructions_count':
            return String(value);
        case 'rating':
            return typeof value === 'number' ? `${value.toFixed(1)} ★` : String(value);
        case 'availability':
            const availTranslations = {
                'AVAILABLE': 'Disponible',
                'OUT_OF_STOCK': 'Rupture de stock',
                'UNKNOWN': 'Inconnu',
                'RETIRING_SOON': 'Bientôt retiré',
                'COMING_SOON': 'Bientôt disponible'
            };
            return availTranslations[value] || String(value);
        default:
            return escapeHtml(String(value));
    }
}
