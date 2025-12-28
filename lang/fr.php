<?php
/**
 * SnowShelf - Fichier de traduction Français
 * 
 * Structure : tableau associatif avec clés hiérarchiques
 * Convention : clés en anglais, valeurs traduites
 */

return [
    // Méta-informations de la langue
    '_meta' => [
        'code' => 'fr',
        'name' => 'Français',
        'flag' => '🇫🇷',
        'direction' => 'ltr', // left-to-right
    ],

    // ============================================
    // ACCROCHE / LANDING
    // ============================================
    'landing' => [
        'tagline' => 'Votre collection, magnifiée.',
        'subtitle' => 'Organisez, cataloguez et partagez vos trésors de collectionneur.',
        'feature_catalog' => 'Cataloguez facilement',
        'feature_catalog_desc' => 'Jeux vidéo, vinyles, livres, figurines... Tout au même endroit.',
        'feature_track' => 'Suivez votre collection',
        'feature_track_desc' => 'Valeur estimée, statistiques et historique complet.',
        'feature_share' => 'Partagez avec la communauté',
        'feature_share_desc' => 'Montrez vos pièces rares et découvrez celles des autres.',
        'feature_scan' => 'Scan intelligent',
        'feature_scan_desc' => 'Ajoutez vos objets en scannant simplement le code-barres.',
    ],

    // ============================================
    // COMMUN (utilisé sur plusieurs pages)
    // ============================================
    'common' => [
        'app_name' => 'SnowShelf',
        'loading' => 'Chargement...',
        'save' => 'Enregistrer',
        'cancel' => 'Annuler',
        'delete' => 'Supprimer',
        'edit' => 'Modifier',
        'add' => 'Ajouter',
        'search' => 'Rechercher',
        'confirm' => 'Confirmer',
        'back' => 'Retour',
        'next' => 'Suivant',
        'previous' => 'Précédent',
        'yes' => 'Oui',
        'no' => 'Non',
        'close' => 'Fermer',
        'submit' => 'Envoyer',
        'reset' => 'Réinitialiser',
        'actions' => 'Actions',
        'options' => 'Options',
        'settings' => 'Paramètres',
        'language' => 'Langue',
        'theme' => 'Thème',
        'all' => 'Tous',
        'active' => 'Actif',
        'inactive' => 'Inactif',
        'coming_soon' => 'Bientôt disponible',
        'work_in_progress' => 'Cette fonctionnalité est en cours de développement.',
        
        // Footer
        'made_with' => 'Fait avec',
        'by' => 'par',
        'design_by' => 'Design par',
    ],

    // ============================================
    // AUTHENTIFICATION
    // ============================================
    'auth' => [
        'login' => 'Connexion',
        'logout' => 'Déconnexion',
        'register' => 'S\'inscrire',
        'username' => 'Nom d\'utilisateur',
        'email' => 'Adresse e-mail',
        'password' => 'Mot de passe',
        'password_confirm' => 'Confirmer le mot de passe',
        'remember_me' => 'Se souvenir de moi',
        'forgot_password' => 'Mot de passe oublié ?',
        'reset_password' => 'Réinitialiser le mot de passe',
        'no_account' => 'Pas encore de compte ?',
        'have_account' => 'Déjà un compte ?',
        'login_success' => 'Connexion réussie !',
        'logout_success' => 'Déconnexion réussie.',
        'register_success' => 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
    ],

    // ============================================
    // API
    // ============================================
    'api' => [
        'unauthorized' => 'Authentification requise.',
        'forbidden' => 'Accès interdit.',
        'not_found' => 'Ressource non trouvée.',
        'method_not_allowed' => 'Méthode non autorisée.',
        'server_error' => 'Erreur serveur.',
        'invalid_request' => 'Requête invalide.',
    ],

    // ============================================
    // ERREURS
    // ============================================
    'errors' => [
        'generic' => 'Une erreur est survenue.',
        'not_found' => 'Page non trouvée.',
        'unauthorized' => 'Accès non autorisé.',
        'forbidden' => 'Accès interdit.',
        'server_error' => 'Erreur serveur.',
        'validation' => 'Veuillez vérifier les champs du formulaire.',
        'credentials' => 'Identifiants incorrects.',
        'empty_fields' => 'Veuillez remplir tous les champs.',
        'email_invalid' => 'Adresse e-mail invalide.',
        'password_mismatch' => 'Les mots de passe ne correspondent pas.',
        'password_weak' => 'Le mot de passe est trop faible.',
        'username_taken' => 'Ce nom d\'utilisateur est déjà pris.',
        'email_taken' => 'Cette adresse e-mail est déjà utilisée.',
        'session_expired' => 'Votre session a expiré. Veuillez vous reconnecter.',
        'email_not_verified' => 'Veuillez vérifier votre adresse e-mail avant de vous connecter.',
    ],

    // ============================================
    // SUCCÈS
    // ============================================
    'success' => [
        'saved' => 'Enregistré avec succès.',
        'deleted' => 'Supprimé avec succès.',
        'updated' => 'Mis à jour avec succès.',
        'created' => 'Créé avec succès.',
        'password_reset' => 'Mot de passe réinitialisé avec succès.',
        'email_sent' => 'E-mail envoyé avec succès.',
        'email_verified' => 'Votre e-mail a été vérifié avec succès ! Vous pouvez maintenant vous connecter.',
        'logout' => 'Vous avez été déconnecté avec succès.',
        'email_changed' => 'Votre adresse e-mail a été modifiée. Veuillez vous reconnecter avec votre nouvelle adresse.',
        'password_changed' => 'Votre mot de passe a été modifié. Veuillez vous reconnecter.',
        'account_deleted' => 'Votre compte a été supprimé avec succès.',
    ],

    // ============================================
    // NAVIGATION / MENU
    // ============================================
    'nav' => [
        'home' => 'Accueil',
        'dashboard' => 'Tableau de bord',
        'collections' => 'Collections',
        'categories' => 'Catégories',
        'items' => 'Objets',
        'profile' => 'Profil',
        'settings' => 'Paramètres',
        'admin' => 'Administration',
        'help' => 'Aide',
        'about' => 'À propos',
    ],

    // ============================================
    // COLLECTIONS
    // ============================================
    'collections' => [
        'title' => 'Mes Collections',
        'create' => 'Nouvelle collection',
        'edit' => 'Modifier la collection',
        'delete' => 'Supprimer la collection',
        'empty' => 'Aucune collection pour le moment.',
        'item_count' => '{count} objet|{count} objets',
        'total_value' => 'Valeur totale',
        'last_updated' => 'Dernière mise à jour',
    ],

    // ============================================
    // TYPES PRIMAIRES (collection)
    // ============================================
    'primary_types' => [
        'books' => 'Livres',
        'video_games' => 'Jeux vidéo',
        'music' => 'Musique',
        'movies' => 'Films',
        'series' => 'Séries',
        'toys_fig' => 'Figurines & Jouets',
        'toys_construct' => 'Jouets de construction',
        'divers' => 'Divers',
        'board_games' => 'Jeux de société',
        'trading_cards' => 'Cartes à collectionner',
        'sticker_albums' => 'Albums d\'images',
    ],

    // ============================================
    // CATÉGORIES D'OBJETS
    // ============================================
    'categories' => [
        'video_games' => 'Jeux vidéo',
        'board_games' => 'Jeux de société',
        'consoles' => 'Consoles & Systèmes',
        'toys' => 'Jouets',
        'books' => 'Livres',
        'trading_cards' => 'Cartes à collectionner',
        'vhs' => 'VHS',
        'dvd' => 'DVD',
        'bluray' => 'Blu-ray',
        'laserdisc' => 'LaserDisc',
        'vinyl' => 'Vinyles',
        'cd' => 'CD Audio',
        'cassette' => 'K7 Audio',
        'sticker_albums' => 'Albums d\'images',
    ],

    // ============================================
    // OBJETS / ITEMS
    // ============================================
    'items' => [
        'title' => 'Titre',
        'name' => 'Nom',
        'description' => 'Description',
        'condition' => 'État',
        'condition_new' => 'Neuf',
        'condition_like_new' => 'Comme neuf',
        'condition_good' => 'Bon état',
        'condition_fair' => 'État acceptable',
        'condition_poor' => 'Mauvais état',
        'purchase_date' => 'Date d\'achat',
        'purchase_price' => 'Prix d\'achat',
        'current_value' => 'Valeur actuelle',
        'quantity' => 'Quantité',
        'location' => 'Emplacement',
        'notes' => 'Notes',
        'barcode' => 'Code-barres',
        'images' => 'Images',
        'add_image' => 'Ajouter une image',
    ],

    // ============================================
    // PROFIL UTILISATEUR
    // ============================================
    'profile' => [
        'title' => 'Mon Profil',
        'edit' => 'Modifier le profil',
        'avatar' => 'Avatar',
        'change_avatar' => 'Changer l\'avatar',
        'display_name' => 'Nom affiché',
        'bio' => 'Biographie',
        'member_since' => 'Membre depuis',
        'change_password' => 'Changer le mot de passe',
        'current_password' => 'Mot de passe actuel',
        'new_password' => 'Nouveau mot de passe',
    ],

    // ============================================
    // PARAMÈTRES
    // ============================================
    'settings' => [
        'title' => 'Paramètres',
        'appearance' => 'Apparence',
        'language' => 'Langue',
        'theme' => 'Thème',
        'notifications' => 'Notifications',
        'privacy' => 'Confidentialité',
        'security' => 'Sécurité',
        'export_data' => 'Exporter mes données',
        'delete_account' => 'Supprimer mon compte',
    ],

    // ============================================
    // DATES ET HEURES
    // ============================================
    'datetime' => [
        'today' => 'Aujourd\'hui',
        'yesterday' => 'Hier',
        'tomorrow' => 'Demain',
        'days_ago' => 'il y a {count} jour|il y a {count} jours',
        'hours_ago' => 'il y a {count} heure|il y a {count} heures',
        'minutes_ago' => 'il y a {count} minute|il y a {count} minutes',
        'just_now' => 'À l\'instant',
    ],

    // ============================================
    // EMAILS
    // ============================================
    'emails' => [
        // Vérification d'email
        'verification_subject' => 'Confirmez votre adresse email - SnowShelf',
        'verification_greeting' => 'Bonjour',
        'verification_intro' => 'Merci de vous être inscrit sur SnowShelf ! Nous sommes ravis de vous accueillir.',
        'verification_instruction' => 'Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :',
        'verification_button' => 'Confirmer mon adresse email',
        'verification_expire' => 'Ce lien de confirmation expire dans 24 heures.',
        'verification_ignore' => 'Si vous n\'avez pas créé de compte sur SnowShelf, vous pouvez ignorer cet email en toute sécurité.',
        
        // Réinitialisation de mot de passe
        'reset_subject' => 'Réinitialisation de votre mot de passe - SnowShelf',
        'reset_greeting' => 'Bonjour',
        'reset_intro' => 'Vous avez demandé la réinitialisation de votre mot de passe SnowShelf.',
        'reset_instruction' => 'Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :',
        'reset_button' => 'Réinitialiser mon mot de passe',
        'reset_expire' => 'Ce lien expire dans 1 heure pour des raisons de sécurité.',
        'reset_ignore' => 'Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel restera inchangé.',
        
        // Footer commun
        'footer_text' => 'Cet email a été envoyé automatiquement par SnowShelf. Merci de ne pas y répondre.',
    ],

    // ============================================
    // VALIDATION DE FORMULAIRE
    // ============================================
    'validation' => [
        'required' => 'Ce champ est obligatoire.',
        'email_format' => 'Veuillez entrer une adresse email valide.',
        'password_min_length' => 'Le mot de passe doit contenir au moins {min} caractères.',
        'password_needs_number' => 'Le mot de passe doit contenir au moins un chiffre.',
        'password_needs_special' => 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...).',
        'password_match' => 'Les mots de passe ne correspondent pas.',
        'username_min_length' => 'Le nom d\'utilisateur doit contenir au moins {min} caractères.',
        'username_max_length' => 'Le nom d\'utilisateur ne peut pas dépasser {max} caractères.',
        'username_format' => 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.',
        'terms_required' => 'Vous devez accepter les conditions d\'utilisation.',
    ],

    // ============================================
    // PAGE D'INSCRIPTION
    // ============================================
    'register' => [
        'title' => 'Créer un compte',
        'subtitle' => 'Rejoignez la communauté SnowShelf',
        'username_placeholder' => 'Choisissez un nom d\'utilisateur',
        'email_placeholder' => 'Votre adresse email',
        'password_placeholder' => 'Créez un mot de passe sécurisé',
        'password_confirm_placeholder' => 'Confirmez votre mot de passe',
        'password_requirements' => 'Min. 8 caractères, 1 chiffre, 1 caractère spécial',
        'terms_agree' => 'J\'accepte les',
        'terms_link' => 'conditions d\'utilisation',
        'privacy_and' => 'et la',
        'privacy_link' => 'politique de confidentialité',
        'submit_button' => 'Créer mon compte',
        'already_account' => 'Déjà inscrit ?',
        'login_link' => 'Se connecter',
        'success_title' => 'Inscription réussie !',
        'success_message' => 'Un email de confirmation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour activer votre compte.',
        'check_spam' => 'Pensez à vérifier vos spams si vous ne recevez rien.',
    ],

    // ============================================
    // VÉRIFICATION D'EMAIL
    // ============================================
    'verify_email' => [
        'title' => 'Vérification de l\'email',
        'success_title' => 'Email vérifié !',
        'success_message' => 'Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.',
        'error_title' => 'Lien invalide',
        'error_message' => 'Ce lien de vérification est invalide ou a expiré.',
        'error_already_verified' => 'Bonne nouvelle ! Votre compte est déjà activé. Vous pouvez vous connecter directement.',
        'error_link_used' => 'Ce lien a déjà été utilisé. Si vous avez vérifié votre email, votre compte est actif.',
        'login_button' => 'Se connecter',
        'resend_link' => 'Renvoyer l\'email de confirmation',
    ],

    // ============================================
    // DASHBOARD
    // ============================================
    'dashboard' => [
        'title' => 'Tableau de bord',
        'home' => 'Accueil',
        'my_collection' => 'Ma collection',
        'scan' => 'Scanner',
        'wishlist' => 'Liste de souhaits',
        'explore' => 'Explorer',
        'community' => 'Communauté',
        'stats' => 'Statistiques',
        'settings' => 'Paramètres',
        'admin' => 'Administration',
        'toggle_menu' => 'Réduire/Agrandir le menu',
        'search_placeholder' => 'Rechercher dans votre collection...',
        'quick_add' => 'Ajout rapide d\'item',
        'quick_add_category' => 'Ajout rapide de catégorie',
        'notifications' => 'Notifications',
        'profile' => 'Mon profil',
        'logout' => 'Déconnexion',
        'role_admin' => 'Admin',
        'role_premium' => 'Premium',
        'role_member' => 'Membre',
        'welcome' => 'Bienvenue',
        'welcome_subtitle' => 'Voici un aperçu de votre collection.',
        'subtitle' => 'Voici un aperçu de votre collection',
        'empty_collection_title' => 'Votre collection est vide',
        'empty_collection_desc' => 'Commencez à ajouter des objets en scannant un code-barres ou en les ajoutant manuellement.',
        'start_scanning' => 'Commencer à scanner',
        
        // Dashboard Home SPA
        'total_books' => 'Objets',
        'wishlist_count' => 'Liste de souhaits',
        'reading_progress' => 'En commande',
        'this_month' => 'Ce mois-ci',
        'recent_activity' => 'Activité récente',
        'no_activity' => 'Aucune activité récente',
        'start_adding' => 'Commencez par ajouter des objets à votre collection',
        'quick_actions' => 'Actions rapides',
        'scan_book' => 'Scanner un objet',
        'add_manual' => 'Ajouter manuellement',
        'search_books' => 'Rechercher un objet',
        'view_stats' => 'Voir les statistiques',
        'reading_goals' => 'Objectifs',
        'no_goals' => 'Aucun objectif défini',
        'set_goals' => 'Définissez vos objectifs dans les paramètres',
        
        // Menu catégories
        'categories' => 'Catégories',
    ],

    // ============================================
    // GESTION DES CATÉGORIES
    // ============================================
    'categories_page' => [
        'title' => 'Gestion des catégories',
        'subtitle' => 'Parcourez et gérez les catégories de votre collection.',
        
        // En-tête et recherche
        'search_placeholder' => 'Rechercher une catégorie...',
        'add_category' => 'Nouvelle catégorie',
        
        // Filtres
        'filter_all' => 'Toutes',
        'filter_default' => 'Par défaut',
        'filter_public' => 'Publiques',
        'filter_mine' => 'Mes catégories',
        'show_default' => 'Afficher les catégories par défaut',
        'show_public' => 'Afficher les catégories publiques',
        
        // Informations catégorie
        'default_badge' => 'Par défaut',
        'public_badge' => 'Publique',
        'private_badge' => 'Privée',
        'owner' => 'Créée par',
        'items_count' => '{count} objet|{count} objets',
        'no_items' => 'Aucun objet',
        'created_at' => 'Créée le',
        
        // Actions
        'view' => 'Voir',
        'view_import' => 'Voir / Importer',
        'edit' => 'Modifier',
        'delete' => 'Supprimer',
        'copy' => 'Copier',
        'import' => 'Importer',
        'save' => 'Enregistrer',
        'make_public' => 'Rendre publique',
        'make_private' => 'Rendre privée',
        'close' => 'Fermer',
        'use_category' => 'Utiliser cette catégorie',
        
        // Formulaire
        'form_title_add' => 'Nouvelle catégorie',
        'form_title_edit' => 'Modifier la catégorie',
        'form_title_view' => 'Détails de la catégorie',
        'field_name' => 'Nom de la catégorie',
        'field_name_placeholder' => 'Ex: Jeux vidéo rétro',
        'field_description' => 'Description',
        'field_description_placeholder' => 'Décrivez cette catégorie...',
        'field_notes' => 'Notes personnelles',
        'field_notes_placeholder' => 'Notes visibles uniquement par vous...',
        'field_icon' => 'Icône',
        'field_icon_hint' => 'Cliquez ou glissez-déposez une image (PNG, JPG, GIF, WebP, SVG, AVIF - max 6 Mo)',
        'field_icon_upload' => 'Cliquer ou déposer une image',
        'error_invalid_image' => 'Format d\'image invalide (PNG, JPG, GIF, WebP, SVG, AVIF)',
        'error_file_too_large' => 'Fichier trop volumineux (max 6 Mo)',
        'field_visible' => 'Catégorie publique',
        'field_visible_hint' => 'Permet aux autres utilisateurs premium de voir et utiliser cette catégorie.',
        'field_owner' => 'Propriétaire',
        'field_original_creator' => 'Créé par',
        'field_items_count' => 'Objets dans cette catégorie',
        'field_created_at' => 'Date de création',
        'field_visibility' => 'Visibilité',
        'field_id' => 'ID',
        'visibility_public' => 'Publique - Visible par tous les utilisateurs Premium',
        'visibility_private' => 'Privée - Visible uniquement par vous',
        'visibility_default' => 'Catégorie système - Disponible pour tous',
        'no_description' => 'Aucune description',
        'no_notes' => 'Aucune note',
        'system_category' => 'Catégorie système',
        
        // Admin : Catégorie par défaut
        'field_is_default' => 'Catégorie système (Admin)',
        'is_default_label' => 'Catégorie par défaut',
        'is_default_hint' => 'Accessible à tous les utilisateurs. Les fichiers seront transférés automatiquement.',
        'is_default_warning' => 'Attention : Rendre cette catégorie "par défaut" la détachera de son propriétaire actuel.',
        
        // Relations catégories mères/filles
        'section_hierarchy' => 'Hiérarchie',
        'section_parents' => 'Catégories parentes',
        'field_parents' => 'Catégories parentes',
        'field_parents_hint' => 'Catégories qui seront automatiquement ajoutées lorsque cette catégorie est sélectionnée pour un objet.',
        'field_children' => 'Sous-catégories',
        'field_children_hint' => 'Catégories qui ont cette catégorie comme parent (lecture seule)',
        'children_readonly_hint' => 'Les sous-catégories sont gérées via le champ "catégories parentes" de ces catégories.',
        'no_parents' => 'Aucune catégorie parente',
        'no_children' => 'Aucune sous-catégorie',
        'parents_placeholder' => 'Rechercher une catégorie parente...',
        'search_category' => 'Rechercher une catégorie...',
        'add_parent' => 'Ajouter une catégorie parente',
        'remove_parent' => 'Retirer',
        'no_results' => 'Aucun résultat',
        // Import des liens par défaut
        'show_default_suggestions' => 'Afficher les suggestions par défaut',
        'default_links_hint' => 'Ces liens sont suggérés par défaut. Cliquez sur un lien pour l\'importer.',
        'import_all_defaults' => 'Importer tous les liens par défaut',
        'link_imported' => 'Lien importé',
        'link_already_exists' => 'Ce lien existe déjà',
        'defaults_imported' => '%d lien(s) par défaut importé(s)',
        'error_import' => 'Erreur lors de l\'import des liens',
        // Section Admin liens par défaut
        'admin_default_links_title' => 'Liens par défaut (pour tous les utilisateurs)',
        'admin_default_links_hint' => 'Ces liens seront proposés par défaut à tous les utilisateurs de cette catégorie.',
        'no_default_links' => 'Aucun lien par défaut configuré',
        'search_default_parent' => 'Ajouter un lien par défaut...',
        
        // Grades (état physique des objets)
        'section_grades' => 'État physique',
        'field_grades' => 'Grades disponibles',
        'field_grades_hint' => 'Grades (états physiques) applicables aux objets de cette catégorie',
        'grades_available' => 'Activez les grades applicables aux objets de cette catégorie',
        'no_grades' => 'Aucun grade configuré',
        'grade_enabled' => 'Activé',
        'grade_disabled' => 'Désactivé',
        'grades_default_section' => 'Grades par défaut',
        'grades_custom_section' => 'Mes grades personnalisés',
        'grades_show_default' => 'Afficher les grades par défaut',
        'grades_hide_default' => 'Masquer les grades par défaut',
        'grades_create' => 'Créer un grade',
        'grades_create_new' => 'Nouveau grade',
        'grades_edit' => 'Modifier',
        'grades_delete' => 'Supprimer',
        'grades_name' => 'Nom du grade',
        'grades_name_placeholder' => 'Ex: Comme neuf, Usé...',
        'grades_description' => 'Description',
        'grades_description_placeholder' => 'Description optionnelle du grade',
        'grades_save' => 'Enregistrer',
        'grades_cancel' => 'Annuler',
        'grades_confirm_delete' => 'Supprimer ce grade ?',
        'grades_confirm_delete_message' => 'Ce grade sera retiré de tous les objets auxquels il est attribué.',
        'grades_created' => 'Grade créé avec succès',
        'grades_updated' => 'Grade modifié avec succès',
        'grades_deleted' => 'Grade supprimé avec succès',
        'grades_premium_only' => 'Fonctionnalité Premium',
        'grades_premium_message' => 'Passez en Premium pour créer vos propres grades personnalisés et les gérer selon vos besoins.',
        'grades_usage_count' => 'Utilisé par %d objet(s)',
        'grades_none_custom' => 'Vous n\'avez pas encore créé de grades personnalisés.',
        'grades_in_use_warning' => 'Attention : ce grade est utilisé sur %d objet(s). Ils perdront ce grade.',
        
        // Médias
        'section_media' => 'Médias',
        'section_images' => 'Images',
        'section_videos' => 'Vidéos',
        'section_audio' => 'Audio',
        'section_documents' => 'Documents',
        'images_count' => '%d image(s)',
        'videos_count' => '%d vidéo(s)',
        'audios_count' => '%d audio(s)',
        'documents_count' => '%d document(s)',
        'no_media' => 'Aucun média',
        'media_coming_soon' => 'Gestion des médias bientôt disponible',
        'media_tab_images' => 'Images',
        'media_tab_videos' => 'Vidéos',
        'media_tab_audio' => 'Audio',
        'media_tab_documents' => 'Documents',
        'media_hint_images' => 'Ajoutez des photos de votre collection. Formats acceptés : JPG, PNG, GIF, WebP. Les images peuvent être recadrées avant l\'envoi.',
        'media_hint_videos' => 'Ajoutez des vidéos (unboxing, présentations...). Formats acceptés : MP4, WebM, AVI, MKV. Une miniature sera générée automatiquement.',
        'media_hint_audio' => 'Ajoutez des fichiers audio (musiques, effets sonores, commentaires...). Formats acceptés : MP3, WAV, OGG, FLAC. Lecture directe dans l\'interface.',
        'media_hint_documents' => 'Ajoutez des documents (manuels, factures, certificats...). Formats acceptés : PDF, DOC, XLS, TXT, ZIP. Téléchargeables depuis l\'interface.',
        'take_photo' => 'Prendre une photo',
        // Lightbox médias
        'prev_image' => 'Image précédente',
        'next_image' => 'Image suivante',
        'video_not_supported' => 'Votre navigateur ne supporte pas la lecture vidéo.',
        
        // Copie
        'copy_success' => 'Catégorie copiée avec succès.',
        
        // Messages
        'confirm_delete' => 'Supprimer cette catégorie ?',
        'confirm_delete_message' => 'Cette action est irréversible. Les objets associés ne seront pas supprimés mais perdront cette catégorie.',
        'created_success' => 'Catégorie créée avec succès.',
        'updated_success' => 'Catégorie mise à jour.',
        'deleted_success' => 'Catégorie supprimée.',
        'copied_success' => 'Catégorie copiée avec succès.',
        'error_name_required' => 'Le nom est obligatoire.',
        'error_name_exists' => 'Une catégorie avec ce nom existe déjà.',
        'error_circular_reference' => 'Une catégorie ne peut pas être sa propre sous-catégorie.',
        
        // États vides
        'empty_title' => 'Aucune catégorie trouvée',
        'empty_message' => 'Aucune catégorie ne correspond à votre recherche.',
        'empty_no_categories' => 'Vous n\'avez pas encore de catégories personnalisées.',
        
        // Premium
        'premium_banner_title' => 'Débloquez les catégories personnalisées',
        'premium_banner_message' => 'Passez en Premium pour créer vos propres catégories et accéder aux catégories publiques de la communauté !',
        'premium_button' => 'Devenir Premium',
        'free_info' => 'En tant qu\'utilisateur gratuit, vous avez accès aux catégories par défaut en consultation.',
        'premium_info' => 'En tant qu\'utilisateur Premium, vous pouvez créer vos propres catégories et accéder à celles partagées par la communauté.',
        
        // Permissions
        'readonly' => 'Consultation seule',
        'readonly_default' => 'Les catégories par défaut ne peuvent pas être modifiées.',
        'readonly_other' => 'Cette catégorie appartient à un autre utilisateur.',
    ],

    // ============================================
    // PAGES LÉGALES
    // ============================================
    'legal' => [
        'terms_title' => 'Conditions Générales d\'Utilisation',
        'privacy_title' => 'Politique de Confidentialité',
        'last_updated' => 'Dernière mise à jour',
        'all_rights_reserved' => 'Tous droits réservés.',
        'accept_terms' => 'J\'accepte les',
        'and' => 'et la',
    ],

    // ============================================
    // ADMINISTRATION
    // ============================================
    'admin' => [
        'title' => 'Administration',
        'users' => 'Utilisateurs',
        'users_management' => 'Gestion des utilisateurs',
        'users_subtitle' => 'Gérez les comptes, rôles et permissions des utilisateurs.',
        'statistics' => 'Statistiques',
        'stats_subtitle' => 'Aperçu des métriques et performances du site.',
        'logs' => 'Journaux',
        'logs_subtitle' => 'Consultez les logs d\'activité et d\'erreurs.',
        'system_settings' => 'Paramètres système',
        'settings_subtitle' => 'Configurez les paramètres globaux de l\'application.',
        
        // Users table
        'add_user' => 'Ajouter un utilisateur',
        'edit_user' => 'Modifier l\'utilisateur',
        'search_users' => 'Rechercher un utilisateur...',
        'all_roles' => 'Tous les rôles',
        'filter_admins' => 'Administrateurs',
        'filter_premium' => 'Premium',
        'filter_members' => 'Membres',
        'sort_id' => 'Trier par ID',
        'sort_name' => 'Trier par nom',
        'sort_email' => 'Trier par email',
        'sort_date' => 'Trier par date',
        'col_user' => 'Utilisateur',
        'col_email' => 'Email',
        'col_role' => 'Rôle',
        'col_status' => 'Statut',
        'col_created' => 'Inscrit le',
        
        // Form
        'is_admin' => 'Administrateur',
        'is_premium' => 'Premium',
        'email_verified' => 'Email vérifié',
        'password_placeholder' => 'Laisser vide pour garder l\'actuel',
        'password_hint' => 'Min. 8 caractères, 1 chiffre, 1 caractère spécial',
        
        // Delete
        'confirm_delete' => 'Confirmer la suppression',
        'delete_user_confirm' => 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.',
        'delete_config_confirm' => 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
        
        // Placeholder sections
        'coming_soon' => 'Bientôt disponible',
        'stats_coming' => 'Les statistiques détaillées seront disponibles prochainement.',
        'logs_coming' => 'La consultation des journaux sera disponible prochainement.',
        'settings_coming' => 'Les paramètres système seront disponibles prochainement.',
        
        // Settings Tabs
        'tab_main_config' => 'Configuration',
        'tab_appearance' => 'Apparence',
        'tab_web_apis' => 'APIs Externes',
        'tab_user_limits' => 'Limites Utilisateurs',
        
        // Main Config
        'main_config_title' => 'Configuration principale',
        'main_config_desc' => 'Paramètres globaux de l\'application SnowShelf.',
        'cfg_timezone' => 'Fuseau horaire',
        'cfg_timezone_hint' => 'Ex: Europe/Paris, America/New_York',
        'cfg_ocr_timeout' => 'Timeout OCR (ms)',
        'cfg_ocr_timeout_hint' => 'Délai d\'attente pour le service OCR en millisecondes',
        'cfg_ocr_url' => 'URL Service OCR',
        'cfg_infos_url' => 'URL Service Infos (toys_api)',
        'cfg_encryption_key' => 'Clé d\'encryption API',
        'cfg_encryption_key_hint' => 'Clé AES-256 pour chiffrer les clés API vers toys_api (doit correspondre à API_ENCRYPTION_KEY du service)',
        'cfg_trad_url' => 'URL Service Traduction',
        'test_url' => 'Tester l\'URL',
        'url_testing' => 'Test en cours...',
        'url_accessible' => 'URL accessible',
        'url_not_accessible' => 'URL non accessible',
        'url_invalid' => 'Format d\'URL invalide',
        'confirm_save_invalid_urls' => 'Certaines URLs ne sont pas accessibles. Voulez-vous quand même sauvegarder ?',
        
        // Appearance
        'appearance_title' => 'Apparence par défaut',
        'appearance_desc' => 'Définissez le thème, la langue et l\'image de fond par défaut pour les nouveaux utilisateurs.',
        'default_theme' => 'Thème par défaut',
        'default_theme_hint' => 'Thème appliqué aux nouveaux utilisateurs',
        'default_lang' => 'Langue par défaut',
        'default_lang_hint' => 'Langue appliquée aux nouveaux utilisateurs',
        'default_background' => 'Image de fond par défaut',
        'default_background_hint' => 'Image affichée en arrière-plan (max 5 Mo). Les utilisateurs peuvent définir leur propre image.',
        'no_background' => 'Aucune image',
        'select_image' => 'Choisir une image',
        'remove_image' => 'Supprimer',
        
        // Web APIs
        'web_apis_title' => 'APIs Externes',
        'add_api' => 'Ajouter une API',
        'edit_api' => 'Modifier l\'API',
        'api_name' => 'Nom',
        'api_type' => 'Type',
        'api_limits' => 'Limites',
        'api_features' => 'Fonctionnalités',
        'api_status' => 'Statut',
        'api_name_field' => 'Identifiant technique',
        'api_name_hint' => 'Nom unique sans espaces (ex: google_books)',
        'api_name_uf' => 'Nom d\'affichage',
        'api_type_field' => 'Type de contenu',
        'select_type' => 'Sélectionner un type',
        'api_client_id' => 'Client ID',
        'api_key_field' => 'Clé API',
        'api_max_premium' => 'Max résultats (Premium)',
        'api_max_free' => 'Max résultats (Gratuit)',
        'api_notes' => 'Notes',
        'api_notes_placeholder' => 'Informations supplémentaires sur cette API...',
        'api_default_active' => 'Actif par défaut',
        'api_user_api' => 'API Utilisateur',
        'api_read_code' => 'Lecture Code-barres',
        'api_has_details' => 'Détails disponibles',
        'api_client_id_on' => 'Requiert Client ID',
        'api_premium_only' => 'Réservé Premium',
        
        // User Limits
        'user_limits_title' => 'Limites Utilisateurs',
        'user_limits_desc' => 'Définissez les limites de fonctionnalités pour les utilisateurs gratuits et premium.',
        'add_limit' => 'Ajouter une limite',
        'edit_limit' => 'Modifier la limite',
        'limit_free' => 'Limite Gratuit',
        'limit_premium' => 'Limite Premium',
        'limit_free_hint' => 'Nombre maximum pour les utilisateurs gratuits',
        'limit_premium_hint' => 'Laisser vide pour illimité',
        
        // Grades par défaut
        'tab_grades' => 'Grades',
        'grades_title' => 'Grades par défaut',
        'grades_desc' => 'Gérez les grades (états physiques) disponibles par défaut pour tous les utilisateurs. Les utilisateurs Premium peuvent créer leurs propres grades personnalisés.',
        'add_grade' => 'Ajouter un grade',
        'edit_grade' => 'Modifier le grade',
        'grade_name' => 'Nom',
        'grade_description' => 'Description',
        'grade_usage' => 'Utilisations',
        'grade_name_field' => 'Nom du grade',
        'grade_name_hint' => 'Ex: Neuf, Très bon état, Bon état...',
        'grade_description_field' => 'Description',
        'grade_description_hint' => 'Description courte de ce grade (optionnelle)',
        'grade_created' => 'Grade créé avec succès',
        'grade_updated' => 'Grade modifié avec succès',
        'grade_deleted' => 'Grade supprimé avec succès',
        'grade_delete_confirm' => 'Supprimer ce grade ?',
        'grade_delete_warning' => 'Ce grade sera retiré de tous les objets qui l\'utilisent.',
        'grade_in_use' => 'Attention : ce grade est utilisé sur %d objet(s).',
        'no_grades' => 'Aucun grade par défaut configuré.',
        
        // Statuts par défaut
        'tab_statuses' => 'Statuts',
        'statuses_title' => 'Statuts par défaut',
        'statuses_desc' => 'Gérez les statuts de possession (Possédé, Souhaité, En commande...) disponibles par défaut pour tous les utilisateurs. Les utilisateurs Premium peuvent créer leurs propres statuts personnalisés.',
        'add_status' => 'Ajouter un statut',
        'edit_status' => 'Modifier le statut',
        'status_name' => 'Nom',
        'status_description' => 'Description',
        'status_color' => 'Couleur',
        'status_icon' => 'Icône',
        'status_usage' => 'Utilisations',
        'status_name_field' => 'Nom du statut',
        'status_name_hint' => 'Ex: Possédé, Souhaité, En commande...',
        'status_description_field' => 'Description',
        'status_description_hint' => 'Description courte de ce statut (optionnelle)',
        'status_color_field' => 'Couleur',
        'status_color_hint' => 'Couleur d\'affichage du statut (format hexadécimal)',
        'status_icon_field' => 'Icône',
        'status_icon_hint' => 'Nom de l\'icône Feather (ex: check-circle, heart, shopping-cart)',
        'status_ordre' => 'Ordre',
        'status_ordre_hint' => 'Position dans la liste (plus petit = plus haut)',
        'status_created' => 'Statut créé avec succès',
        'status_updated' => 'Statut modifié avec succès',
        'status_deleted' => 'Statut supprimé avec succès',
        'status_delete_confirm' => 'Supprimer ce statut ?',
        'status_delete_warning' => 'Ce statut sera retiré de tous les objets qui l\'utilisent.',
        'status_in_use' => 'Attention : ce statut est utilisé sur %d objet(s).',
        'no_statuses' => 'Aucun statut par défaut configuré.',
        
        // Configuration des uploads
        'tab_upload_config' => 'Uploads',
        'upload_config_title' => 'Configuration des Uploads',
        'upload_config_desc' => 'Gérez les types de fichiers autorisés, les tailles maximales et les catégories d\'upload. Ces paramètres sont utilisés par SecureUpload pour valider les fichiers téléversés.',
        'add_upload_config' => 'Ajouter une catégorie',
        'edit_upload_config' => 'Modifier la configuration',
        'upload_category' => 'Catégorie',
        'upload_category_hint' => 'Identifiant unique en minuscules (ex: avatar, images, videos)',
        'upload_category_pattern' => 'Uniquement des lettres minuscules et underscores',
        'upload_extensions' => 'Extensions autorisées',
        'upload_extensions_hint' => 'Séparées par des virgules (ex: jpg, png, gif, webp)',
        'upload_max_size' => 'Taille max',
        'upload_max_size_hint' => 'Taille maximale autorisée en mégaoctets (1-2048 MB)',
        'upload_description' => 'Description',
        'upload_description_placeholder' => 'Description courte de cette catégorie...',
        'upload_is_active' => 'Actif',
        'upload_is_active_hint' => 'Désactivé = cette catégorie d\'upload sera refusée',
        'upload_status' => 'Statut',
        'upload_status_active' => 'Actif',
        'upload_status_inactive' => 'Inactif',
        'upload_config_created' => 'Catégorie d\'upload créée avec succès',
        'upload_config_updated' => 'Configuration mise à jour avec succès',
        'upload_config_deleted' => 'Catégorie d\'upload supprimée',
        'upload_config_delete_confirm' => 'Supprimer cette catégorie d\'upload ?',
        
        // Types primaires et fournisseurs
        'tab_primary_types' => 'Types & Fournisseurs',
        'primary_types_title' => 'Types Primaires et Fournisseurs par Défaut',
        'primary_types_desc' => 'Associez chaque type primaire à un type d\'API web et sélectionnez les fournisseurs activés par défaut pour la recherche web.',
        'primary_type_webapi_type' => 'Type d\'API associé',
        'primary_type_webapi_type_none' => '-- Aucun --',
        'primary_type_default_providers' => 'Fournisseurs par défaut',
        'primary_type_no_providers' => 'Aucun fournisseur disponible pour ce type',
        'primary_type_saved' => 'Configuration du type sauvegardée',
        'primary_type_error' => 'Erreur lors de la sauvegarde',
        'upload_config_delete_warning' => 'Attention : les uploads de ce type ne seront plus acceptés.',
        'upload_category_exists' => 'Cette catégorie existe déjà',
        'no_upload_configs' => 'Aucune configuration d\'upload.',
        
        // Section Bases de données
        'databases' => 'Bases de données',
        'databases_subtitle' => 'Gérez les bases de données internes de SnowShelf.',
        
        // Plateformes VG_DB
        'db_vg_platforms' => 'Plateformes VG_DB',
        'db_total_platforms' => 'Total plateformes',
        'db_with_local_images' => 'Avec images locales',
        'db_with_external_images' => 'Avec images externes',
        'db_with_images' => 'Avec images',
        'db_without_images' => 'Sans images',
        'db_without_images_filter' => 'Sans images',
        'db_search_platforms' => 'Rechercher une plateforme...',
        'db_all_manufacturers' => 'Tous les fabricants',
        'db_all_images' => 'Toutes les images',
        'db_local_images' => 'Images locales',
        'db_external_images' => 'Images externes',
        'db_add_platform' => 'Ajouter une plateforme',
        'db_fetch_images' => 'Récupérer images',
        'db_fetch_all_images_title' => 'Récupérer automatiquement les images manquantes',
        'db_fetching_images' => 'Récupération des images en cours...',
        'db_col_image' => 'Image',
        'db_col_name' => 'Nom',
        'db_col_manufacturer' => 'Fabricant',
        'db_col_release_date' => 'Date de sortie',
        'db_col_images_count' => 'Images',
        
        // Modal plateforme
        'db_edit_platform' => 'Modifier la plateforme',
        'db_create_platform' => 'Nouvelle plateforme',
        'db_platform_name' => 'Nom',
        'db_platform_slug' => 'Slug',
        'db_platform_manufacturer' => 'Fabricant',
        'db_platform_release_date' => 'Date de sortie',
        'db_platform_generation' => 'Génération',
        'db_platform_local_images' => 'Images locales',
        'db_platform_remote_image' => 'Image distante (URL)',
        'db_platform_upload_hint' => 'Glissez-déposez des images ou cliquez pour sélectionner',
        'db_platform_no_local_images' => 'Aucune image locale',
        'db_platform_saved' => 'Plateforme sauvegardée',
        'db_platform_created' => 'Plateforme créée',
        'db_platform_deleted' => 'Plateforme supprimée',
        'db_platform_image_uploaded' => 'Image téléversée',
        'db_platform_image_deleted' => 'Image supprimée',
        'db_delete_platform_confirm' => 'Supprimer cette plateforme ?',
        'db_delete_image_confirm' => 'Supprimer cette image ?',
        'db_no_platforms' => 'Aucune plateforme trouvée.',
        
        // Type Fields (Champs de métadonnées)
        'tab_type_fields' => 'Champs de détails',
        'type_fields_title' => 'Champs de métadonnées',
        'type_fields_desc' => 'Gérez les champs de métadonnées affichés dans l\'onglet "Détails" du modal d\'item, pour chaque type primaire.',
        'filter_by_type' => 'Filtrer par type',
        'order' => '#',
        'field_key' => 'Clé',
        'field_name' => 'Nom (FR)',
        'field_type' => 'Type',
        'mappings' => 'Mappings',
        'add_type_field' => 'Ajouter un champ',
        'edit_type_field' => 'Modifier le champ',
        'primary_type' => 'Type primaire',
        'display_order' => 'Ordre d\'affichage',
        'translations_json' => 'Traductions (JSON)',
        'field_options_json' => 'Options (JSON)',
        'required' => 'Champ obligatoire',
        
        // Field Mappings (Mappings API)
        'tab_field_mappings' => 'Mappings API',
        'target_field' => 'Champ cible',
        'add_field_mapping' => 'Ajouter un mapping',
        'edit_field_mapping' => 'Modifier le mapping',
        'field_mappings_title' => 'Mappings API → Champs',
        'field_mappings_desc' => 'Configurez la correspondance entre les clés retournées par les APIs de recherche web et les champs de métadonnées. Permet de transformer automatiquement les valeurs lors de l\'import.',
        'item_field_mappings' => 'Champs fixes',
        'item_field_mappings_tooltip' => 'Configurer les mappings pour les champs fixes (nom, description, valeur, médias)',
        'filter_by_field' => 'Champ',
        'api_keys' => 'Clés API',
        'transform' => 'Transformation',
        'transform_config' => 'Configuration de transformation',
        'priority' => 'Priorité',
        'active' => 'Actif',
        'field' => 'Champ',
        'type' => 'Type',
    ],

    // ============================================
    // GESTION DU COMPTE UTILISATEUR
    // ============================================
    'account' => [
        'title' => 'Mon compte',
        
        // Tabs
        'tab_profile' => 'Profil',
        'tab_security' => 'Sécurité',
        'tab_appearance' => 'Apparence',
        'tab_privacy' => 'Confidentialité',
        
        // Profile Section
        'profile_title' => 'Informations du profil',
        'profile_subtitle' => 'Gérez vos informations personnelles et votre avatar.',
        'change_avatar' => 'Changer l\'avatar',
        'avatar_hint' => 'JPG, PNG ou GIF. Maximum 2 Mo.',
        'username_hint' => '3 à 50 caractères. Lettres, chiffres et underscores uniquement.',
        'email_hint' => 'Votre adresse email de connexion.',
        'bio' => 'Biographie',
        'bio_placeholder' => 'Parlez-nous de vous et de vos collections...',
        'bio_hint' => 'Visible sur votre profil public. Maximum 500 caractères.',
        'newsletter' => 'Recevoir la newsletter',
        'newsletter_hint' => 'Actualités, nouvelles fonctionnalités et conseils de collection.',
        'account_info' => 'Informations du compte',
        'member_since' => 'Membre depuis',
        'account_type' => 'Type de compte',
        'premium_until' => 'Premium jusqu\'au',
        
        // Security Section
        'security_title' => 'Sécurité du compte',
        'security_subtitle' => 'Gérez votre mot de passe et les options de sécurité.',
        'change_password' => 'Changer le mot de passe',
        'current_password' => 'Mot de passe actuel',
        'new_password' => 'Nouveau mot de passe',
        'confirm_password' => 'Confirmer le nouveau mot de passe',
        'password_requirements' => 'Minimum 8 caractères, au moins 1 chiffre et 1 caractère spécial.',
        'update_password' => 'Mettre à jour le mot de passe',
        'danger_zone' => 'Zone dangereuse',
        'danger_warning' => 'Les actions ci-dessous sont irréversibles. Procédez avec précaution.',
        'delete_account' => 'Supprimer mon compte',
        'delete_account_title' => 'Supprimer votre compte',
        'delete_account_warning' => 'Cette action est définitive et irréversible. Toutes vos collections, objets et données seront supprimés de façon permanente.',
        'enter_password_confirm' => 'Entrez votre mot de passe pour confirmer',
        'confirm_delete' => 'Supprimer définitivement',
        
        // Appearance Section
        'appearance_title' => 'Apparence',
        'appearance_subtitle' => 'Personnalisez l\'apparence de votre interface.',
        'theme_hint' => 'Choisissez un thème visuel pour l\'interface.',
        'lang_hint' => 'Langue de l\'interface utilisateur.',
        'background' => 'Image de fond',
        'no_background' => 'Aucune image',
        'select_image' => 'Choisir une image',
        'background_hint' => 'Image affichée en arrière-plan. JPG, PNG, GIF ou WebP. Maximum 5 Mo.',
        
        // Privacy Section
        'privacy_title' => 'Confidentialité',
        'privacy_subtitle' => 'Contrôlez qui peut voir vos informations et votre collection.',
        'collection_visibility' => 'Visibilité de la collection',
        'visibility_private' => '🔒 Privée - Moi uniquement',
        'visibility_friends' => '👥 Amis - Mes contacts uniquement',
        'visibility_public' => '🌍 Publique - Tout le monde',
        'visibility_hint' => 'Définit qui peut voir votre collection et vos objets.',
        'show_email' => 'Afficher mon email sur mon profil public',
        'show_email_hint' => 'Permet aux autres membres de vous contacter par email.',
        
        // API Keys Section
        'tab_api_keys' => 'Clés API',
        'api_keys_title' => 'Clés API personnelles',
        'api_keys_subtitle' => 'Configurez vos propres clés API pour accéder à des fournisseurs de recherche supplémentaires.',
        'api_keys_intro' => 'Certains fournisseurs de recherche nécessitent une clé API personnelle. Vous pouvez obtenir ces clés gratuitement sur les sites des fournisseurs.',
        'api_key_placeholder' => 'Entrez votre clé API...',
        'client_id_placeholder' => 'Entrez votre Client ID...',
        'client_secret_placeholder' => 'Entrez votre Client Secret...',
        'api_key_label' => 'Clé API',
        'client_id_label' => 'Client ID',
        'client_secret_label' => 'Client Secret / Token',
        'no_api_keys_configured' => 'Aucune clé API configurée',
        'get_api_key' => 'Obtenir une clé',
        'api_key_saved' => 'Clé API enregistrée avec succès',
        'api_key_deleted' => 'Clé API supprimée',
        'api_key_error' => 'Erreur lors de l\'enregistrement de la clé API',
        'api_key_test' => 'Tester',
        'api_key_testing' => 'Test en cours...',
        'api_key_valid' => 'Clé API valide',
        'api_key_invalid' => 'Clé API invalide ou expirée',
        'api_key_remove' => 'Supprimer la clé',
        'api_key_remove_confirm' => 'Voulez-vous supprimer cette clé API ?',
        'api_provider_type' => 'Type : %s',
        'api_provider_docs' => 'Documentation',
        'api_key_configured' => 'Configuré',
        'api_key_shared_with' => 'Cette clé sera aussi utilisée par',
    ],

    // ============================================
    // ÉDITEUR D'ICÔNES
    // ============================================
    'icon_editor' => [
        'title' => 'Éditeur d\'icône',
        'rotate_left' => 'Rotation gauche',
        'rotate_right' => 'Rotation droite',
        'flip_horizontal' => 'Miroir horizontal',
        'flip_vertical' => 'Miroir vertical',
        'zoom_in' => 'Zoom avant',
        'zoom_out' => 'Zoom arrière',
        'reset' => 'Réinitialiser',
        'cancel' => 'Annuler',
        'save' => 'Enregistrer',
        'preview' => 'Aperçu',
        'drag_hint' => 'Glissez pour déplacer',
        'zoom_hint' => 'Molette ou pincement pour zoomer',
        'loading' => 'Chargement...',
        'error_load' => 'Erreur de chargement de l\'image',
        'error_save' => 'Erreur lors de la sauvegarde',
    ],

    // ============================================
    // ÉDITEUR D'IMAGES
    // ============================================
    'image_editor' => [
        'title' => 'Éditeur d\'image',
        'rotate_left' => 'Rotation gauche (90°)',
        'rotate_right' => 'Rotation droite (90°)',
        'flip_horizontal' => 'Miroir horizontal',
        'flip_vertical' => 'Miroir vertical',
        'zoom_in' => 'Zoom avant',
        'zoom_out' => 'Zoom arrière',
        'reset' => 'Réinitialiser',
        'crop' => 'Recadrer',
        'crop_mode' => 'Mode recadrage',
        'brightness' => 'Luminosité',
        'contrast' => 'Contraste',
        'saturation' => 'Saturation',
        'preview' => 'Aperçu',
        'drag_hint' => 'Glissez pour déplacer',
        'zoom_hint' => 'Molette ou pincement pour zoomer',
        'error_load' => 'Erreur de chargement de l\'image',
        'error_save' => 'Erreur lors de la sauvegarde',
        'processing' => 'Traitement en cours...',
    ],

    // ============================================
    // CAPTURE CAMÉRA
    // ============================================
    'camera' => [
        'title' => 'Prendre une photo',
        'initializing' => 'Initialisation de la caméra...',
        'error_camera' => 'Impossible d\'accéder à la caméra',
        'error_permission' => 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.',
        'error_not_supported' => 'Votre navigateur ne supporte pas l\'accès à la caméra',
        'error_capture' => 'Erreur lors de la capture',
        'retry' => 'Réessayer',
        'take_photo' => 'Prendre une photo',
        'switch_camera' => 'Changer de caméra',
        'flash' => 'Flash',
        'flash_off' => 'Flash désactivé',
        'flash_on' => 'Flash activé',
        'flash_auto' => 'Flash automatique',
        'zoom_hint' => 'Molette ou pincement pour zoomer',
        'select_camera' => 'Caméra :',
        'camera' => 'Caméra',
        'processing' => 'Traitement...',
        'front_camera' => 'Avant',
        'back_camera' => 'Arrière',
        'wide_camera' => 'Grand angle',
        'ultra_camera' => 'Ultra grand angle',
        'tele_camera' => 'Téléobjectif',
        // Mode scan
        'scan_title' => 'Scanner',
        'scan_capture' => 'Scanner',
        'scan_barcode_label' => 'Code-barres',
        'scan_document_label' => 'Document',
        'scan_auto_label' => 'Auto',
        'scan_barcode_hint' => 'Placez le code-barres dans le cadre',
        'scan_document_hint' => 'Cadrez le texte à reconnaître',
        'scan_auto_hint' => 'Code-barres ou texte détecté automatiquement',
        'scan_searching' => 'Recherche...',
        'scan_detected' => 'Détecté !',
    ],
    
    // Gestionnaire de médias
    'media' => [
        'add_files' => 'Ajouter',
        'drag_drop' => 'Glissez-déposez ou cliquez ici',
        'delete_all' => 'Tout supprimer',
        'delete_confirm' => 'Supprimer ce fichier ?',
        'delete_all_confirm' => 'Supprimer tous les fichiers de cette catégorie ?',
        'no_files' => 'Aucun fichier',
        'uploading' => 'Upload en cours...',
        'processing' => 'Traitement...',
        'error_upload' => 'Erreur lors de l\'upload',
        'error_type' => 'Type de fichier non autorisé',
        'error_size' => 'Fichier trop volumineux',
        'play' => 'Écouter',
        'pause' => 'Pause',
        'view' => 'Voir',
        'download' => 'Télécharger',
        'edit' => 'Modifier',
        'images' => 'Images',
        'videos' => 'Vidéos',
        'audio' => 'Audio',
        'documents' => 'Documents',
        'tab_images' => 'Images',
        'tab_videos' => 'Vidéos',
        'tab_audio' => 'Audio',
        'tab_documents' => 'Documents',
        'section_title' => 'Médias',
        'loading' => 'Chargement des médias...',
        'error_load' => 'Erreur lors du chargement des médias',
    ],

    // ============================================
    // VISIONNEUSE DE DOCUMENTS
    // ============================================
    'document_viewer' => [
        // Commun
        'loading' => 'Chargement...',
        'error_load' => 'Impossible de charger le fichier',
        'error_format' => 'Format non supporté',
        'download' => 'Télécharger',
        'close' => 'Fermer',
        'fullscreen' => 'Plein écran',
        'exit_fullscreen' => 'Quitter le plein écran',
        
        // Navigation
        'page' => 'Page',
        'of' => 'sur',
        'prev_page' => 'Page précédente',
        'next_page' => 'Page suivante',
        'first_page' => 'Première page',
        'last_page' => 'Dernière page',
        
        // Zoom
        'zoom_in' => 'Zoom avant',
        'zoom_out' => 'Zoom arrière',
        'zoom_reset' => 'Réinitialiser le zoom',
        'fit' => 'Ajuster',
        'fit_width' => 'Ajuster à la largeur',
        'fit_height' => 'Ajuster à la hauteur',
        
        // Image
        'rotate_left' => 'Rotation à gauche',
        'rotate_right' => 'Rotation à droite',
        
        // Archive
        'files' => 'fichiers',
        'folders' => 'dossiers',
        'extract' => 'Extraire',
        'extract_all' => 'Tout extraire',
        'extracting' => 'Extraction...',
        'archive_empty' => 'Archive vide',
        
        // EPUB
        'table_of_contents' => 'Table des matières',
        'show_toc' => 'Afficher le sommaire',
        'hide_toc' => 'Masquer le sommaire',
        'chapter' => 'Chapitre',
        'prev_chapter' => 'Chapitre précédent',
        'next_chapter' => 'Chapitre suivant',
        
        // Comic / BD
        'single_page' => 'Page simple',
        'double_page' => 'Double page',
        'reading_mode' => 'Mode de lecture',
        
        // Téléchargement
        'download_title' => 'Télécharger le fichier',
        'download_desc' => 'Ce type de fichier ne peut pas être prévisualisé. Vous pouvez le télécharger pour l\'ouvrir.',
        'file_type' => 'Type de fichier',
    ],

    // ============================================
    // COLLECTION
    // ============================================
    'collection' => [
        // Général
        'title' => 'Ma Collection',
        'items_count' => 'éléments',
        'item_count' => 'élément',
        'add_item' => 'Ajouter un item',
        'add_first_item' => 'Ajouter votre premier item',
        'loading' => 'Chargement...',
        'error_loading' => 'Erreur lors du chargement de la collection',
        
        // Recherche et filtres
        'search_placeholder' => 'Rechercher dans ma collection...',
        'filters' => 'Filtres',
        'filters_title' => 'Filtres avancés',
        'sort' => 'Trier',
        'sort_name_asc' => 'Nom (A-Z)',
        'sort_name_desc' => 'Nom (Z-A)',
        'sort_recent' => 'Plus récent',
        'sort_oldest' => 'Plus ancien',
        'sort_rating' => 'Meilleure note',
        'sort_value' => 'Valeur la plus élevée',
        
        // Filtres
        'filter_categories' => 'Catégories',
        'all_categories' => 'Toutes les catégories',
        'filter_rating' => 'Note minimum',
        'filter_value' => 'Valeur marchande',
        'filter_acquisition' => 'Date d\'acquisition',
        'filter_status' => 'Statut',
        'all_statuses' => 'Tous les statuts',
        'reset_filters' => 'Réinitialiser',
        'apply_filters' => 'Appliquer',
        'clear_filters' => 'Effacer les filtres',
        
        // Vues
        'view_grid' => 'Vue grille',
        'view_list' => 'Vue liste',
        
        // Item
        'no_image' => 'Pas d\'image',
        'categories' => 'Catégories',
        'rating' => 'Note',
        'value' => 'Valeur',
        'acquired' => 'Acquis le',
        'edit' => 'Modifier',
        'delete' => 'Supprimer',
        
        // États vides
        'empty_title' => 'Votre collection est vide',
        'empty_message' => 'Commencez par ajouter votre premier item pour démarrer votre collection.',
        'no_results_title' => 'Aucun résultat',
        'no_results_message' => 'Aucun item ne correspond à vos critères de recherche.',
        
        // Actions
        'confirm_delete' => 'Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.',
        'deleted' => 'Item supprimé avec succès',
        'error_delete' => 'Erreur lors de la suppression',
        'back_to_top' => 'Retour en haut',
        
        // API
        'item_not_found' => 'Item non trouvé',
        'name_required' => 'Le nom est obligatoire',
        'id_required' => 'L\'identifiant est obligatoire',
        'not_owner' => 'Vous n\'êtes pas propriétaire de cet item',
        'item_created' => 'Item créé avec succès',
        'item_updated' => 'Item mis à jour avec succès',
        'item_deleted' => 'Item supprimé avec succès',
        'audio_preview_unavailable' => 'Aperçu audio non disponible (protection du service)',
        
        // Catégories
        'personal_categories' => 'Mes catégories',
        'default_categories' => 'Catégories par défaut',
        
        // Modal de visualisation/édition
        'modal_view_title' => 'Détails de l\'item',
        'modal_add_title' => 'Nouvel item',
        'modal_edit_title' => 'Modifier l\'item',
        
        // Champs du formulaire
        'field_name' => 'Nom',
        'field_name_placeholder' => 'Nom de l\'objet',
        'field_description' => 'Description',
        'field_description_placeholder' => 'Décrivez cet objet...',
        'field_notes' => 'Notes personnelles',
        'field_notes_placeholder' => 'Notes privées, visibles uniquement par vous...',
        'field_barcode' => 'Code-barres',
        'field_barcode_placeholder' => 'Code-barres de l\'objet',
        'field_rating' => 'Note',
        'field_rating_hint' => 'Note de 0.5 à 5 étoiles',
        'field_purchase_price' => 'Prix d\'achat',
        'field_market_value' => 'Valeur marchande',
        'field_acquisition_date' => 'Date d\'acquisition',
        'field_search_state' => 'État de recherche',
        'field_categories' => 'Catégories',
        'field_categories_placeholder' => 'Sélectionner des catégories...',
        'field_grades' => 'État physique',
        'field_grades_placeholder' => 'Sélectionner un état...',
        'field_storage_location' => 'Emplacement de stockage',
        'field_storage_location_placeholder' => 'Où est rangé cet objet...',
        'no_storage_location' => 'Non défini',
        'add_storage_location' => 'Ajouter un emplacement',
        'storage_location_name_placeholder' => 'Ex: Étagère salon, Boîte grenier...',
        'storage_location_desc_placeholder' => 'Description optionnelle...',
        'storage_location_created' => 'Emplacement créé avec succès',
        'grades_section_personal' => 'Mes grades',
        'grades_section_defaults' => 'Grades par défaut',
        'no_grades_for_categories' => 'Sélectionnez des catégories pour voir les états disponibles',
        'field_grades_placeholder' => 'Sélectionner un état...',
        
        // Sections
        'section_info' => 'Informations',
        'section_values' => 'Valeurs',
        'section_dates' => 'Dates',
        'section_media' => 'Médias',
        'section_categories' => 'Catégories',
        'section_grades' => 'État physique',
        'section_status' => 'Statut',
        
        // États de recherche (legacy)
        'search_state_owned' => 'Possédé',
        'search_state_searching' => 'En recherche',
        'search_state_found' => 'Trouvé',
        
        // Statuts de possession
        'field_status' => 'Statut',
        'field_status_placeholder' => 'Sélectionner un statut...',
        'no_status' => 'Aucun statut',
        'all_statuses' => 'Tous les statuts',
        'show_default_statuses' => 'Afficher les statuts par défaut',
        'hide_default_statuses' => 'Masquer les statuts par défaut',
        'manage_my_statuses' => 'Gérer mes statuts',
        'my_statuses' => 'Mes statuts',
        'default_statuses' => 'Statuts par défaut',
        
        // Type primaire
        'field_primary_type' => 'Type de contenu',
        'field_primary_type_placeholder' => 'Sélectionner un type...',
        'no_primary_type' => 'Non défini',
        'all_primary_types' => 'Tous les types',
        
        // Onglets du formulaire d'item
        'tab_general' => 'Général',
        'tab_details' => 'Détails',
        'tab_media' => 'Médias',
        'details_select_type' => 'Sélectionnez un type de contenu dans l\'onglet "Général" pour voir les champs spécifiques.',
        'details_no_fields' => 'Aucun champ spécifique pour ce type.',
        'details_error' => 'Erreur lors du chargement des champs.',
        'select_option' => 'Choisir',
        'multiselect_selected' => '{count} sélectionné(s)',
        
        // Catégories - sélecteur
        'show_default_categories' => 'Afficher les catégories par défaut',
        'auto_select_parents' => 'Sélectionner les parents automatiquement',
        'categories_selected' => '{count} catégorie(s) sélectionnée(s)',
        'no_category_selected' => 'Aucune catégorie sélectionnée',
        'select_categories' => 'Sélectionner des catégories...',
        
        // Modal gestion des statuts utilisateur
        'modal_statuses_title' => 'Gérer mes statuts',
        'modal_status_add' => 'Nouveau statut',
        'modal_status_edit' => 'Modifier le statut',
        'status_name' => 'Nom du statut',
        'status_name_placeholder' => 'Ex: À restaurer, Prêté à Paul...',
        'status_description' => 'Description',
        'status_description_placeholder' => 'Description courte (optionnelle)',
        'status_color' => 'Couleur',
        'status_icon' => 'Icône',
        'status_icon_hint' => 'Nom de l\'icône Feather (optionnel)',
        'status_created' => 'Statut créé',
        'status_updated' => 'Statut mis à jour',
        'status_deleted' => 'Statut supprimé',
        'status_delete_confirm' => 'Supprimer ce statut ?',
        'status_delete_warning' => 'Ce statut sera retiré de tous vos items.',
        'no_custom_statuses' => 'Vous n\'avez pas encore de statuts personnalisés',
        'create_first_status' => 'Créer votre premier statut',
        
        // Valeurs
        'no_value' => 'Non renseigné',
        'no_description' => 'Aucune description',
        'no_notes' => 'Aucune note',
        'no_barcode' => 'Non renseigné',
        'no_date' => 'Non renseignée',
        'no_categories' => 'Aucune catégorie',
        'no_grades' => 'Non renseigné',
        'no_location' => 'Non renseigné',
        
        // Compteurs médias
        'images_count' => '%d image(s)',
        'videos_count' => '%d vidéo(s)',
        'audios_count' => '%d audio(s)',
        'documents_count' => '%d document(s)',
        'media_coming_soon' => 'Gestion des médias bientôt disponible',
        
        // Actions
        'save' => 'Enregistrer',
        'cancel' => 'Annuler',
        'close' => 'Fermer',
        'delete_confirm_title' => 'Supprimer cet item ?',
        'delete_confirm_message' => 'Cette action est irréversible. L\'item et tous ses médias associés seront supprimés définitivement.',
        'created_success' => 'Item créé avec succès',
        'updated_success' => 'Item mis à jour avec succès',
        'deleted_success' => 'Item supprimé avec succès',
        'error_load' => 'Erreur lors du chargement de l\'item',
        'error_save' => 'Erreur lors de l\'enregistrement',
        'error_delete' => 'Erreur lors de la suppression',
        
        // Dates formatées
        'created_at' => 'Créé le',
        'updated_at' => 'Modifié le',
        
        // Import depuis recherche web
        'error_import_image' => 'Erreur lors de l\'import de l\'image',
        'error_import_document' => 'Erreur lors de l\'import du document',
        'import_image_success' => 'Image importée avec succès',
        'import_document_success' => 'Document importé avec succès',
        'warning_images_protected' => 'Images non importées (source protégée contre le téléchargement)',
    ],

    // ============================================
    // RECHERCHE WEB
    // ============================================
    'web_search' => [
        // Types de contenu
        'type_all' => 'Tous les types',
        'type_video_games' => 'Jeux vidéo',
        'type_books' => 'Livres',
        'type_toys' => 'Jouets',
        'type_generic' => 'Générique',
        'type_movies' => 'Films & Séries',
        'type_music' => 'Musique',

        // Labels
        'title' => 'Recherche Web',
        'type_label' => 'Type de contenu',
        'providers_label' => 'Fournisseurs',
        'text_search_label' => 'Recherche textuelle',
        'text_search_placeholder' => 'Nom, titre, description...',
        'image_search_label' => 'Recherche par image',
        'image_drop_hint' => 'Glissez une image ou cliquez',
        'results_title' => 'Résultats',

        // Boutons
        'search_btn' => 'Rechercher',
        'stop_btn' => 'Arrêter',
        'browse_file' => 'Parcourir',
        'camera_btn' => 'Photo',
        'camera_btn_title' => 'Prendre une photo pour reconnaissance',
        'scan_btn' => 'Scan',
        'scan_btn_title' => 'Scanner un code-barres',
        'search_image_btn' => 'Rechercher',
        'close' => 'Fermer',
        'select_result' => 'Sélectionner',
        'view_source' => 'Voir la source',

        // Options
        'use_local_db_label' => 'Utiliser la BDD SnowShelf',
        'use_local_db_tooltip' => 'Utilise les données en cache. Désactiver pour forcer une recherche fraîche depuis les sources externes',
        'auto_translate_label' => 'Auto-traduction',
        'auto_translate_tooltip' => 'Si la réponse n\'est pas disponible dans votre langue, une traduction automatique sera effectuée',
        'auto_translate_premium_hint' => 'Fonctionnalité réservée aux utilisateurs Premium',

        // États
        'no_results_yet' => 'Lancez une recherche pour voir les résultats',
        'no_results' => 'Aucun résultat trouvé',
        'searching' => 'Recherche en cours...',
        'results_found' => 'résultat(s)',
        'search_cancelled' => 'Recherche annulée',
        'result_selected' => 'Résultat sélectionné',
        'image_processed' => 'Image traitée',

        // Fournisseurs
        'supports_barcode' => 'Supporte les codes-barres',
        'no_providers' => 'Aucun fournisseur disponible pour ce type',
        'premium_badge' => 'Premium',
        'premium_only_provider' => 'Réservé aux utilisateurs Premium',

        // Erreurs
        'error_loading' => 'Erreur de chargement des fournisseurs',
        'error_empty_query' => 'Veuillez saisir un texte de recherche',
        'error_no_provider' => 'Veuillez sélectionner au moins un fournisseur',
        'error_no_image' => 'Veuillez sélectionner une image',
        'error_invalid_image' => 'Format d\'image invalide',
        'error_search' => 'Erreur lors de la recherche',
        'error_premium_required' => 'Le fournisseur %provider% nécessite un abonnement Premium',
        'error_user_key_required' => 'Vous devez configurer votre clé API pour %s dans les paramètres de votre compte',
        
        // Fonctionnalités à venir
        'image_search_coming_soon' => 'Recherche par image bientôt disponible',
        'camera_not_available' => 'Caméra non disponible',
        'barcode_not_detected' => 'Aucun code-barres détecté sur l\'image',

        // Modal de détails et import
        'detail_title' => 'Détails du résultat',
        'detail_import_as' => 'Importer comme',
        'detail_select_type' => 'Choisir le type',
        'detail_select_fields' => 'Sélectionner les champs à importer',
        'detail_select_all' => 'Tout',
        'detail_select_none' => 'Rien',
        'detail_import_btn' => 'Importer la sélection',
        'detail_cancel_btn' => 'Annuler',
        'detail_view_source' => 'Voir sur le site',
        'detail_no_metadata' => 'Aucune métadonnée disponible',
        'detail_no_description' => 'Pas de description disponible',
        'detail_metadata_section' => 'Métadonnées',
        'detail_import_section' => 'Options d\'import',
        'detail_field_name' => 'Nom suggéré',
        'detail_field_description' => 'Description',
        'detail_field_image' => 'Image',
        'detail_field_images' => 'Images',
        'detail_field_price' => 'Valeur marchande',
        'detail_field_barcode' => 'Code-barres',
        'detail_field_videos' => 'Vidéos',
        'detail_field_audio' => 'Audio',
        'detail_field_documents' => 'Documents / Manuels',
        'detail_general_fields' => 'Informations générales',
        'detail_media_fields' => 'Médias',
        'detail_type_fields' => 'Détails spécifiques',
        'detail_no_media' => 'Aucun média disponible',
        'detail_no_type_fields' => 'Aucun champ spécifique pour ce type',
        'detail_import_success' => 'Données importées avec succès',
        'detail_no_field_selected' => 'Veuillez sélectionner au moins un champ à importer',
        'detail_load_more' => 'Plus de détails',
        'detail_load_more_title' => 'Charger les informations complètes depuis le fournisseur',
        'detail_loading' => 'Chargement...',
        'detail_loaded' => 'Détails chargés',
        'detail_loaded_success' => 'Détails chargés avec succès',
        'detail_load_error' => 'Erreur lors du chargement des détails',
        'detail_images_hint' => 'Clic = voir, Double-clic = sélectionner',
        'detail_images_selected' => 'sélectionnée(s)',
        'detail_select_all_images' => 'Tout sélectionner',
        'detail_deselect_all_images' => 'Tout désélectionner',
        'detail_instructions_section' => 'Manuels d\'instructions',
        'detail_selected' => 'sélectionné(s)',
        'detail_view_pdf' => 'Voir le PDF',
        'detail_deselect_all' => 'Tout désélectionner',

        // Confirmation d'import
        'import_confirm_title' => 'Confirmer le remplacement',
        'import_confirm_message' => 'Les champs suivants contiennent déjà des données et seront remplacés :',
        'import_confirm_yes' => 'Remplacer',
        'import_confirm_cancel' => 'Annuler',
        'import_field_name' => 'Nom suggéré',
        'import_field_description' => 'Description',
        'import_field_price' => 'Valeur marchande',
        'import_field_barcode' => 'Code-barres',
        'import_cancelled' => 'Import annulé',
        'warning_docs_failed' => 'Certains documents n\'ont pas pu être importés (fichiers inaccessibles ou erreur réseau).',
        'warning_docs_partial' => '{imported}/{total} document(s) importé(s). Certains fichiers n\'ont pas pu être téléchargés.',
    ],
    
    // Labels des métadonnées (pour l'import web)
    'metadata' => [
        // Communs
        'year' => 'Année',
        'rating' => 'Note',
        'price' => 'Prix',
        'availability' => 'Disponibilité',
        'reviews_count' => 'Nombre d\'avis',
        
        // Toys / LEGO
        'set_number' => 'Numéro de set',
        'brand' => 'Marque',
        'pieces' => 'Pièces',
        'unique_parts' => 'Pièces uniques',
        'minifigs' => 'Minifigurines',
        'minifigs_list' => 'Liste des minifigs',
        'theme' => 'Thème',
        'theme_id' => 'ID du thème',
        'subtheme' => 'Sous-thème',
        'age_range' => 'Tranche d\'âge',
        'dimensions' => 'Dimensions',
        'weight' => 'Poids',
        'designer' => 'Designer',
        'difficulty' => 'Difficulté',
        'vip_points' => 'Points VIP',
        'instructions_url' => 'Instructions',
        'instructions' => 'Instructions',
        'instructions_count' => 'Manuels d\'instructions',
        'rebrickable_id' => 'ID Rebrickable',
        'parts_count' => 'Nombre de pièces',
        
        // Books
        'authors' => 'Auteurs',
        'author' => 'Auteur',
        'isbn' => 'ISBN',
        'pages' => 'Pages',
        'publisher' => 'Éditeur',
        'language' => 'Langue',
        
        // Video Games
        'platforms' => 'Plateformes',
        'platform' => 'Plateforme',
        'developer' => 'Développeur',
        'developers' => 'Développeurs',
        'publishers' => 'Éditeurs',
        'release_date' => 'Date de sortie',
        'genres' => 'Genres',
        'genre' => 'Genre',
        'metacritic' => 'Metacritic',
        'playtime' => 'Durée de jeu',
        'esrb_rating' => 'Classification PEGI',
        
        // Movies / Series
        'runtime' => 'Durée',
        'duration' => 'Durée',
        'director' => 'Réalisateur',
        'episodes' => 'Épisodes',
        'seasons' => 'Saisons',
        'media_type' => 'Type de média',
        'votes' => 'Votes',
        'tagline' => 'Slogan',
        'budget' => 'Budget',
        'revenue' => 'Recettes',
        'status' => 'Statut',
        'original_language' => 'Langue originale',
        'production_companies' => 'Sociétés de production',
        'networks' => 'Chaînes',
        
        // Music
        'artist' => 'Artiste',
        'album' => 'Album',
        'track_count' => 'Nombre de pistes',
        'tracks' => 'Pistes',
        
        // Divers
        'category' => 'Catégorie',
        'collection' => 'Collection',
        'series' => 'Série',
        'condition' => 'État',
        'barcode' => 'Code-barres',
        'barcode_type' => 'Type de code-barres',
        
        // Albums de stickers
        'total_stickers' => 'Nombre total d\'images',
        'special_stickers' => 'Images spéciales',
        'checklist' => 'Checklist',
    ],
];
