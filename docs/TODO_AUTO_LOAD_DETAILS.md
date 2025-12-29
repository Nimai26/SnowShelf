# TODO - Chargement automatique des détails WebSearch

## Objectif
Améliorer l'UX de l'onglet "Détails" en chargeant automatiquement les données à l'ouverture de l'onglet, au lieu de demander un clic supplémentaire.

## Tâches

### 1. [ ] Modifier le comportement de l'onglet Détails
- Fichier : `public/assets/js/web-search/ui/details.js`
- Au clic sur l'onglet "Détails" → lancer `fetchApiDetails()` automatiquement
- Afficher un spinner/skeleton pendant le chargement

### 2. [ ] Implémenter le cache des données
- Stocker le résultat dans `state.detailData` ou `state.cachedDetails`
- Clé de cache : combinaison `webapiId + resultId` ou URL unique
- Si données en cache → afficher directement sans refetch

### 3. [ ] Indicateur visuel "données en cache"
- Afficher un indicateur quand les données viennent du cache
- Ex: petit badge ou texte discret "Données en cache"

### 4. [ ] Remplacer le bouton "Charger détails" par "Actualiser"
- Bouton visible uniquement quand données en cache
- Au clic → forcer le rechargement sans cache
- Icône refresh (fa-sync-alt ou mdi-refresh)

### 5. [ ] Gestion des erreurs
- Si fetch échoue → afficher message d'erreur + bouton "Réessayer"
- Ne pas bloquer l'interface

### 6. [ ] Traductions i18n
- Ajouter les clés :
  - `web_search.detail_loading` : "Chargement des détails..."
  - `web_search.detail_from_cache` : "Données en cache"
  - `web_search.detail_refresh` : "Actualiser"
  - `web_search.detail_retry` : "Réessayer"

## Fichiers à modifier
- `public/assets/js/web-search/ui/details.js` - Logique principale
- `public/assets/js/web-search/state.js` - Ajout state.cachedDetails
- `public/assets/js/web-search/modal.js` - Gestion tabs si nécessaire
- `lang/fr.php` - Traductions FR
- `lang/en.php` - Traductions EN
- `public/assets/css/web-search.css` - Styles pour indicateur cache

## Notes techniques
- Le cache doit être vidé quand le modal WebSearch est fermé
- Le cache est par résultat (pas global)
