# 📬 SnowShelf — Mise à jour du 3 avril 2026

Bonjour à tous ! 👋

Voici un résumé des dernières améliorations et corrections déployées sur **SnowShelf** ces dernières heures. Cette mise à jour se concentre sur l'**expérience mobile**, la **communication** et la **fiabilité de l'application**.

---

## 🚀 Nouvelles fonctionnalités

### Système de newsletters
Les administrateurs peuvent désormais créer, éditer et publier des **newsletters** directement depuis l'espace admin. Chaque newsletter peut cibler une **audience spécifique** (Tous, Free, Premium, Admin) et être diffusée via :
- **Notification in-app + push** (cloche)
- **Email** aux abonnés newsletter de l'audience cible

Les newsletters publiées sont consultables par tous les utilisateurs depuis la page **/newsletters**.

### Navigation mobile complète
Le menu **Gestion** (Statuts, Grades, Emplacements) était uniquement accessible depuis la version bureau. Il est désormais disponible directement depuis votre **page Profil** sur mobile, accompagné de raccourcis vers toutes les sections principales : Explorer, Amis, Notifications et Paramètres.

### Boutons d'action visibles sur le formulaire d'item
Lors de la création ou modification d'un item — en particulier après un import web ou un scan — les boutons **Annuler** et **Créer / Modifier** sont maintenant affichés **en haut du formulaire** en plus du bas de page. Fini le scroll pour trouver comment sauvegarder !

### Ajout rapide depuis une photo
Nouveau bouton **"Ajout rapide"** sur la page Items ! Prenez une photo, recadrez-la si besoin, renseignez un nom et une catégorie, et c'est enregistré. Idéal pour cataloguer rapidement vos objets sans passer par le formulaire complet.

---

## 🐛 Corrections de bugs

### Cloche de notifications en temps réel
Le badge de la cloche de notifications ne se mettait à jour qu'au rechargement de la page. Il est désormais **synchronisé en temps réel** : les nouvelles notifications apparaissent automatiquement (polling toutes les 30 secondes) et le compteur se met à jour instantanément quand vous marquez une notification comme lue ou la supprimez.

### Mises à jour bloquées par le cache
Un problème empêchait l'application de charger les nouvelles versions : le fichier Service Worker était mis en cache pendant 1 an par le navigateur. Ce comportement a été corrigé — les mises à jour sont désormais appliquées immédiatement.

### Appareil photo : contrôles masqués
Sur mobile, les boutons de contrôle de l'appareil photo (flash, capture, changement de caméra) étaient partiellement cachés derrière la barre de navigation. L'espacement a été corrigé pour que tous les contrôles soient parfaitement accessibles.

### Éditeur d'image : recadrage tactile
La fonction de **recadrage (crop)** ne fonctionnait pas sur mobile car seuls les événements souris étaient pris en charge. L'éditeur supporte désormais pleinement les **interactions tactiles** avec des poignées de redimensionnement plus grandes et plus faciles à manipuler.

### Éditeur d'image : boutons hors écran
Les boutons **Annuler** et **Enregistrer** de l'éditeur d'image étaient poussés hors de l'écran sur mobile. La barre du bas a été réorganisée en deux lignes (options de format + boutons d'action) pour garantir leur visibilité sur tous les écrans.

---

## 📱 Résumé

| Type | Description |
|------|-------------|
| ✨ Nouveau | Système de newsletters admin (audience ciblée + email) |
| ✨ Nouveau | Navigation Gestion accessible sur mobile |
| ✨ Nouveau | Boutons Créer/Modifier visibles en haut du formulaire |
| ✨ Nouveau | Ajout rapide d'item depuis une photo |
| 🔧 Corrigé | Cloche de notifications synchronisée en temps réel |
| 🔧 Corrigé | Cache Service Worker bloquant les mises à jour |
| 🔧 Corrigé | Contrôles caméra cachés sur mobile |
| 🔧 Corrigé | Recadrage tactile dans l'éditeur d'image |
| 🔧 Corrigé | Boutons éditeur d'image hors écran sur mobile |

---

Merci pour vos retours qui nous permettent d'améliorer continuellement SnowShelf ! N'hésitez pas à nous signaler tout problème rencontré. 🙏

*— L'équipe SnowShelf*
