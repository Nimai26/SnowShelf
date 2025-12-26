<?php
/**
 * SnowShelf - Conditions Générales d'Utilisation
 */

session_start();

// Chargement du système i18n
require_once __DIR__ . '/../core/i18n.php';

// Récupération du thème et langue (par défaut: dracula)
$theme = $_COOKIE['snowshelf_theme'] ?? 'dracula';
$lang = getLang();
?>
<!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= __('common.app_name') ?> - <?= __('legal.terms_title') ?>">
    <title><?= __('common.app_name') ?> - <?= __('legal.terms_title') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
    <link rel="icon" type="image/png" sizes="64x64" href="assets/images/favicon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16.png">
    <link rel="apple-touch-icon" href="assets/images/favicon.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="themes/themes.css?v=1.0">
    <link rel="stylesheet" href="assets/css/legal.css?v=1.0">
    
    <!-- Préchargement de l'image de fond -->
    <link rel="preload" as="image" href="assets/images/backgrounds/login-bg.jpg">
</head>
<body class="legal-page">
    <!-- Fond d'écran avec overlay -->
    <div class="legal-background">
        <div class="legal-overlay"></div>
    </div>
    
    <!-- Conteneur principal -->
    <main class="legal-container">
        <!-- En-tête -->
        <header class="legal-header">
            <a href="register.php" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <?= __('common.back') ?>
            </a>
            <div class="legal-logo">
                <img src="assets/images/logo.png" alt="<?= __('common.app_name') ?> Logo">
            </div>
        </header>
        
        <!-- Contenu -->
        <article class="legal-content">
            <h1><?= __('legal.terms_title') ?></h1>
            <p class="legal-updated"><?= __('legal.last_updated') ?> : 1er décembre 2025</p>
            
            <?php if ($lang === 'fr'): ?>
            <!-- VERSION FRANÇAISE -->
            
            <section>
                <h2>1. Présentation</h2>
                <p>Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation du service SnowShelf, une application web de gestion de collections d'objets, développée et éditée par <strong>SnowMan Prod</strong> (1998-2025).</p>
                <p>En accédant et en utilisant SnowShelf, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.</p>
            </section>
            
            <section>
                <h2>2. Définitions</h2>
                <ul>
                    <li><strong>"Service"</strong> : désigne l'application web SnowShelf et toutes ses fonctionnalités.</li>
                    <li><strong>"Utilisateur"</strong> : désigne toute personne physique accédant au Service.</li>
                    <li><strong>"Compte"</strong> : désigne l'espace personnel créé par l'Utilisateur pour accéder au Service.</li>
                    <li><strong>"Contenu"</strong> : désigne toutes les données, textes, images et fichiers ajoutés par l'Utilisateur.</li>
                    <li><strong>"Éditeur"</strong> : désigne SnowMan Prod, société éditrice du Service.</li>
                </ul>
            </section>
            
            <section>
                <h2>3. Inscription et Compte Utilisateur</h2>
                <h3>3.1 Création de compte</h3>
                <p>Pour utiliser le Service, vous devez créer un compte en fournissant :</p>
                <ul>
                    <li>Un nom d'utilisateur unique</li>
                    <li>Une adresse e-mail valide</li>
                    <li>Un mot de passe sécurisé (minimum 8 caractères, incluant au moins un chiffre et un caractère spécial)</li>
                </ul>
                
                <h3>3.2 Vérification de l'e-mail</h3>
                <p>Un e-mail de confirmation vous sera envoyé. Vous devez valider votre adresse e-mail avant de pouvoir vous connecter.</p>
                
                <h3>3.3 Responsabilité du compte</h3>
                <p>Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte. En cas de suspicion d'utilisation frauduleuse, contactez-nous immédiatement.</p>
            </section>
            
            <section>
                <h2>4. Utilisation du Service</h2>
                <h3>4.1 Usage autorisé</h3>
                <p>Le Service est destiné à un usage personnel pour la gestion de collections d'objets. Vous pouvez :</p>
                <ul>
                    <li>Créer, modifier et supprimer des collections</li>
                    <li>Ajouter des objets avec descriptions et médias</li>
                    <li>Organiser et catégoriser vos collections</li>
                    <li>Exporter vos données personnelles</li>
                </ul>
                
                <h3>4.2 Usages interdits</h3>
                <p>Il est strictement interdit de :</p>
                <ul>
                    <li>Utiliser le Service à des fins illégales</li>
                    <li>Télécharger du contenu illicite, offensant ou portant atteinte aux droits de tiers</li>
                    <li>Tenter de compromettre la sécurité du Service</li>
                    <li>Partager votre compte avec des tiers</li>
                    <li>Utiliser des robots ou scripts automatisés</li>
                    <li>Revendre ou commercialiser l'accès au Service</li>
                </ul>
            </section>
            
            <section>
                <h2>5. Propriété Intellectuelle</h2>
                <h3>5.1 Droits de l'Éditeur</h3>
                <p>Le Service, son design, son code source, ses logos et marques sont la propriété exclusive de SnowMan Prod. Toute reproduction, modification ou utilisation non autorisée est interdite.</p>
                
                <h3>5.2 Droits de l'Utilisateur</h3>
                <p>Vous conservez la propriété de tout le Contenu que vous ajoutez au Service. En utilisant le Service, vous accordez à SnowMan Prod une licence limitée pour stocker et afficher votre Contenu dans le cadre de la fourniture du Service.</p>
            </section>
            
            <section>
                <h2>6. Protection des Données</h2>
                <p>Le traitement de vos données personnelles est régi par notre <a href="privacy.php">Politique de Confidentialité</a>. En utilisant le Service, vous acceptez cette politique.</p>
            </section>
            
            <section>
                <h2>7. Disponibilité du Service</h2>
                <p>SnowMan Prod s'efforce d'assurer la disponibilité du Service 24h/24, 7j/7. Cependant, nous ne garantissons pas une disponibilité ininterrompue et nous nous réservons le droit d'interrompre temporairement le Service pour maintenance.</p>
            </section>
            
            <section>
                <h2>8. Limitation de Responsabilité</h2>
                <p>Le Service est fourni "tel quel". SnowMan Prod ne saurait être tenu responsable :</p>
                <ul>
                    <li>Des pertes de données dues à des circonstances indépendantes de notre volonté</li>
                    <li>Des dommages indirects liés à l'utilisation du Service</li>
                    <li>Du contenu téléchargé par les Utilisateurs</li>
                </ul>
            </section>
            
            <section>
                <h2>9. Résiliation</h2>
                <h3>9.1 Par l'Utilisateur</h3>
                <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.</p>
                
                <h3>9.2 Par l'Éditeur</h3>
                <p>SnowMan Prod se réserve le droit de suspendre ou supprimer votre compte en cas de violation des présentes CGU, sans préavis.</p>
            </section>
            
            <section>
                <h2>10. Modifications des CGU</h2>
                <p>SnowMan Prod peut modifier les présentes CGU à tout moment. Les modifications seront notifiées par e-mail et/ou sur le Service. La poursuite de l'utilisation du Service après modification vaut acceptation des nouvelles CGU.</p>
            </section>
            
            <section>
                <h2>11. Droit Applicable</h2>
                <p>Les présentes CGU sont régies par le droit français. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis aux tribunaux compétents français.</p>
            </section>
            
            <section>
                <h2>12. Contact</h2>
                <p>Pour toute question concernant ces CGU, vous pouvez nous contacter :</p>
                <ul>
                    <li>Par e-mail : contact@snowmanprod.fr</li>
                    <li>Via le formulaire de contact sur le site</li>
                </ul>
            </section>
            
            <?php else: ?>
            <!-- ENGLISH VERSION -->
            
            <section>
                <h2>1. Introduction</h2>
                <p>These Terms of Service (hereinafter "Terms") govern the use of the SnowShelf service, a web application for managing collections of items, developed and published by <strong>SnowMan Prod</strong> (1998-2025).</p>
                <p>By accessing and using SnowShelf, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.</p>
            </section>
            
            <section>
                <h2>2. Definitions</h2>
                <ul>
                    <li><strong>"Service"</strong>: refers to the SnowShelf web application and all its features.</li>
                    <li><strong>"User"</strong>: refers to any individual accessing the Service.</li>
                    <li><strong>"Account"</strong>: refers to the personal space created by the User to access the Service.</li>
                    <li><strong>"Content"</strong>: refers to all data, texts, images and files added by the User.</li>
                    <li><strong>"Publisher"</strong>: refers to SnowMan Prod, the company publishing the Service.</li>
                </ul>
            </section>
            
            <section>
                <h2>3. Registration and User Account</h2>
                <h3>3.1 Account Creation</h3>
                <p>To use the Service, you must create an account by providing:</p>
                <ul>
                    <li>A unique username</li>
                    <li>A valid email address</li>
                    <li>A secure password (minimum 8 characters, including at least one number and one special character)</li>
                </ul>
                
                <h3>3.2 Email Verification</h3>
                <p>A confirmation email will be sent to you. You must verify your email address before you can log in.</p>
                
                <h3>3.3 Account Responsibility</h3>
                <p>You are responsible for maintaining the confidentiality of your credentials and for all activities conducted through your account. If you suspect fraudulent use, contact us immediately.</p>
            </section>
            
            <section>
                <h2>4. Use of the Service</h2>
                <h3>4.1 Permitted Use</h3>
                <p>The Service is intended for personal use for managing item collections. You may:</p>
                <ul>
                    <li>Create, edit, and delete collections</li>
                    <li>Add items with descriptions and media</li>
                    <li>Organize and categorize your collections</li>
                    <li>Export your personal data</li>
                </ul>
                
                <h3>4.2 Prohibited Uses</h3>
                <p>It is strictly forbidden to:</p>
                <ul>
                    <li>Use the Service for illegal purposes</li>
                    <li>Upload illegal, offensive, or rights-infringing content</li>
                    <li>Attempt to compromise the security of the Service</li>
                    <li>Share your account with third parties</li>
                    <li>Use bots or automated scripts</li>
                    <li>Resell or commercialize access to the Service</li>
                </ul>
            </section>
            
            <section>
                <h2>5. Intellectual Property</h2>
                <h3>5.1 Publisher's Rights</h3>
                <p>The Service, its design, source code, logos, and trademarks are the exclusive property of SnowMan Prod. Any unauthorized reproduction, modification, or use is prohibited.</p>
                
                <h3>5.2 User's Rights</h3>
                <p>You retain ownership of all Content you add to the Service. By using the Service, you grant SnowMan Prod a limited license to store and display your Content as part of providing the Service.</p>
            </section>
            
            <section>
                <h2>6. Data Protection</h2>
                <p>The processing of your personal data is governed by our <a href="privacy.php">Privacy Policy</a>. By using the Service, you agree to this policy.</p>
            </section>
            
            <section>
                <h2>7. Service Availability</h2>
                <p>SnowMan Prod strives to ensure the Service is available 24/7. However, we do not guarantee uninterrupted availability and reserve the right to temporarily suspend the Service for maintenance.</p>
            </section>
            
            <section>
                <h2>8. Limitation of Liability</h2>
                <p>The Service is provided "as is". SnowMan Prod shall not be liable for:</p>
                <ul>
                    <li>Data loss due to circumstances beyond our control</li>
                    <li>Indirect damages related to the use of the Service</li>
                    <li>Content uploaded by Users</li>
                </ul>
            </section>
            
            <section>
                <h2>9. Termination</h2>
                <h3>9.1 By the User</h3>
                <p>You may delete your account at any time from your profile settings.</p>
                
                <h3>9.2 By the Publisher</h3>
                <p>SnowMan Prod reserves the right to suspend or delete your account in case of violation of these Terms, without notice.</p>
            </section>
            
            <section>
                <h2>10. Changes to Terms</h2>
                <p>SnowMan Prod may modify these Terms at any time. Changes will be notified by email and/or on the Service. Continued use of the Service after modification constitutes acceptance of the new Terms.</p>
            </section>
            
            <section>
                <h2>11. Governing Law</h2>
                <p>These Terms are governed by French law. Any dispute relating to the interpretation or execution of these Terms shall be submitted to the competent French courts.</p>
            </section>
            
            <section>
                <h2>12. Contact</h2>
                <p>For any questions regarding these Terms, you may contact us:</p>
                <ul>
                    <li>By email: contact@snowmanprod.fr</li>
                    <li>Via the contact form on the website</li>
                </ul>
            </section>
            
            <?php endif; ?>
        </article>
        
        <!-- Sélecteur de langue -->
        <div class="language-selector">
            <?= renderLangSelector('lang-select') ?>
        </div>
    </main>
    
    <!-- Footer -->
    <?php include __DIR__ . '/components/footer.php'; ?>
    
    <script>
        // Changement de langue
        document.getElementById('lang-select')?.addEventListener('change', function() {
            document.cookie = `snowshelf_lang=${this.value};path=/;max-age=31536000`;
            location.reload();
        });
    </script>
</body>
</html>
