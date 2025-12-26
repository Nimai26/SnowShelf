<?php
/**
 * SnowShelf - Politique de Confidentialité
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
    <meta name="description" content="<?= __('common.app_name') ?> - <?= __('legal.privacy_title') ?>">
    <title><?= __('common.app_name') ?> - <?= __('legal.privacy_title') ?></title>
    
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
            <h1><?= __('legal.privacy_title') ?></h1>
            <p class="legal-updated"><?= __('legal.last_updated') ?> : 1er décembre 2025</p>
            
            <?php if ($lang === 'fr'): ?>
            <!-- VERSION FRANÇAISE -->
            
            <section>
                <h2>1. Introduction</h2>
                <p><strong>SnowMan Prod</strong> (1998-2025) s'engage à protéger la vie privée des utilisateurs de SnowShelf. Cette Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos données personnelles.</p>
                <p>En utilisant notre Service, vous acceptez les pratiques décrites dans cette politique.</p>
            </section>
            
            <section>
                <h2>2. Responsable du Traitement</h2>
                <p>Le responsable du traitement des données est :</p>
                <ul>
                    <li><strong>Société</strong> : SnowMan Prod</li>
                    <li><strong>E-mail</strong> : privacy@snowmanprod.fr</li>
                    <li><strong>Site web</strong> : https://snowmanprod.fr</li>
                </ul>
            </section>
            
            <section>
                <h2>3. Données Collectées</h2>
                <h3>3.1 Données fournies par l'utilisateur</h3>
                <ul>
                    <li><strong>Données d'inscription</strong> : nom d'utilisateur, adresse e-mail, mot de passe (hashé)</li>
                    <li><strong>Données de profil</strong> : avatar, préférences de langue et de thème</li>
                    <li><strong>Données de collections</strong> : objets, descriptions, images, catégories</li>
                </ul>
                
                <h3>3.2 Données collectées automatiquement</h3>
                <ul>
                    <li><strong>Données de connexion</strong> : date et heure de connexion, adresse IP</li>
                    <li><strong>Cookies</strong> : préférences de session, langue, thème</li>
                    <li><strong>Données techniques</strong> : type de navigateur, système d'exploitation</li>
                </ul>
            </section>
            
            <section>
                <h2>4. Finalités du Traitement</h2>
                <p>Vos données sont utilisées pour :</p>
                <table class="legal-table">
                    <thead>
                        <tr>
                            <th>Finalité</th>
                            <th>Base légale</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Création et gestion de votre compte</td>
                            <td>Exécution du contrat</td>
                        </tr>
                        <tr>
                            <td>Fourniture du Service</td>
                            <td>Exécution du contrat</td>
                        </tr>
                        <tr>
                            <td>Envoi d'e-mails transactionnels</td>
                            <td>Exécution du contrat</td>
                        </tr>
                        <tr>
                            <td>Amélioration du Service</td>
                            <td>Intérêt légitime</td>
                        </tr>
                        <tr>
                            <td>Sécurité et prévention des fraudes</td>
                            <td>Intérêt légitime</td>
                        </tr>
                        <tr>
                            <td>Communication marketing (si consentement)</td>
                            <td>Consentement</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            
            <section>
                <h2>5. Conservation des Données</h2>
                <ul>
                    <li><strong>Données de compte</strong> : conservées pendant toute la durée d'utilisation du Service, puis 3 ans après la suppression du compte</li>
                    <li><strong>Données de connexion</strong> : 1 an</li>
                    <li><strong>Cookies de session</strong> : jusqu'à fermeture du navigateur</li>
                    <li><strong>Cookies de préférences</strong> : 1 an</li>
                </ul>
            </section>
            
            <section>
                <h2>6. Partage des Données</h2>
                <p>Nous ne vendons jamais vos données personnelles. Vos données peuvent être partagées avec :</p>
                <ul>
                    <li><strong>Hébergeur</strong> : pour le stockage sécurisé des données</li>
                    <li><strong>Service d'e-mail</strong> : pour l'envoi des e-mails transactionnels</li>
                    <li><strong>Autorités</strong> : si requis par la loi</li>
                </ul>
            </section>
            
            <section>
                <h2>7. Sécurité des Données</h2>
                <p>Nous mettons en œuvre des mesures de sécurité appropriées :</p>
                <ul>
                    <li>Chiffrement SSL/TLS pour toutes les communications</li>
                    <li>Hachage des mots de passe avec bcrypt</li>
                    <li>Accès restreint aux données personnelles</li>
                    <li>Sauvegardes régulières et sécurisées</li>
                    <li>Surveillance et détection des intrusions</li>
                </ul>
            </section>
            
            <section>
                <h2>8. Vos Droits (RGPD)</h2>
                <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
                <ul>
                    <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
                    <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                    <li><strong>Droit à l'effacement</strong> : supprimer vos données ("droit à l'oubli")</li>
                    <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
                    <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                    <li><strong>Droit d'opposition</strong> : vous opposer au traitement</li>
                    <li><strong>Droit de retrait du consentement</strong> : retirer votre consentement à tout moment</li>
                </ul>
                <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@snowmanprod.fr">privacy@snowmanprod.fr</a></p>
            </section>
            
            <section>
                <h2>9. Cookies</h2>
                <h3>9.1 Cookies utilisés</h3>
                <table class="legal-table">
                    <thead>
                        <tr>
                            <th>Cookie</th>
                            <th>Type</th>
                            <th>Durée</th>
                            <th>Finalité</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>PHPSESSID</td>
                            <td>Essentiel</td>
                            <td>Session</td>
                            <td>Gestion de la session</td>
                        </tr>
                        <tr>
                            <td>snowshelf_theme</td>
                            <td>Préférence</td>
                            <td>1 an</td>
                            <td>Thème visuel choisi</td>
                        </tr>
                        <tr>
                            <td>snowshelf_lang</td>
                            <td>Préférence</td>
                            <td>1 an</td>
                            <td>Langue préférée</td>
                        </tr>
                        <tr>
                            <td>snowshelf_remember</td>
                            <td>Fonctionnel</td>
                            <td>30 jours</td>
                            <td>Connexion persistante</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3>9.2 Gestion des cookies</h3>
                <p>Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.</p>
            </section>
            
            <section>
                <h2>10. Transferts Internationaux</h2>
                <p>Vos données sont stockées sur des serveurs situés en France/Union Européenne. En cas de transfert hors UE, nous nous assurons que des garanties appropriées sont en place.</p>
            </section>
            
            <section>
                <h2>11. Mineurs</h2>
                <p>Le Service n'est pas destiné aux personnes de moins de 16 ans. Si nous apprenons que des données d'un mineur ont été collectées, nous les supprimerons immédiatement.</p>
            </section>
            
            <section>
                <h2>12. Modifications</h2>
                <p>Nous pouvons mettre à jour cette Politique de Confidentialité. Toute modification sera publiée sur cette page avec une nouvelle date de mise à jour. Les modifications importantes seront notifiées par e-mail.</p>
            </section>
            
            <section>
                <h2>13. Réclamation</h2>
                <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a></p>
            </section>
            
            <section>
                <h2>14. Contact</h2>
                <p>Pour toute question concernant cette politique ou vos données personnelles :</p>
                <ul>
                    <li><strong>E-mail</strong> : privacy@snowmanprod.fr</li>
                    <li><strong>Délégué à la Protection des Données</strong> : dpo@snowmanprod.fr</li>
                </ul>
            </section>
            
            <?php else: ?>
            <!-- ENGLISH VERSION -->
            
            <section>
                <h2>1. Introduction</h2>
                <p><strong>SnowMan Prod</strong> (1998-2025) is committed to protecting the privacy of SnowShelf users. This Privacy Policy describes how we collect, use, store, and protect your personal data.</p>
                <p>By using our Service, you agree to the practices described in this policy.</p>
            </section>
            
            <section>
                <h2>2. Data Controller</h2>
                <p>The data controller is:</p>
                <ul>
                    <li><strong>Company</strong>: SnowMan Prod</li>
                    <li><strong>Email</strong>: privacy@snowmanprod.fr</li>
                    <li><strong>Website</strong>: https://snowmanprod.fr</li>
                </ul>
            </section>
            
            <section>
                <h2>3. Data Collected</h2>
                <h3>3.1 Data provided by the user</h3>
                <ul>
                    <li><strong>Registration data</strong>: username, email address, password (hashed)</li>
                    <li><strong>Profile data</strong>: avatar, language and theme preferences</li>
                    <li><strong>Collection data</strong>: items, descriptions, images, categories</li>
                </ul>
                
                <h3>3.2 Automatically collected data</h3>
                <ul>
                    <li><strong>Connection data</strong>: login date and time, IP address</li>
                    <li><strong>Cookies</strong>: session preferences, language, theme</li>
                    <li><strong>Technical data</strong>: browser type, operating system</li>
                </ul>
            </section>
            
            <section>
                <h2>4. Processing Purposes</h2>
                <p>Your data is used for:</p>
                <table class="legal-table">
                    <thead>
                        <tr>
                            <th>Purpose</th>
                            <th>Legal Basis</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Creating and managing your account</td>
                            <td>Contract performance</td>
                        </tr>
                        <tr>
                            <td>Providing the Service</td>
                            <td>Contract performance</td>
                        </tr>
                        <tr>
                            <td>Sending transactional emails</td>
                            <td>Contract performance</td>
                        </tr>
                        <tr>
                            <td>Improving the Service</td>
                            <td>Legitimate interest</td>
                        </tr>
                        <tr>
                            <td>Security and fraud prevention</td>
                            <td>Legitimate interest</td>
                        </tr>
                        <tr>
                            <td>Marketing communications (if consented)</td>
                            <td>Consent</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            
            <section>
                <h2>5. Data Retention</h2>
                <ul>
                    <li><strong>Account data</strong>: retained for the duration of Service use, then 3 years after account deletion</li>
                    <li><strong>Connection data</strong>: 1 year</li>
                    <li><strong>Session cookies</strong>: until browser closes</li>
                    <li><strong>Preference cookies</strong>: 1 year</li>
                </ul>
            </section>
            
            <section>
                <h2>6. Data Sharing</h2>
                <p>We never sell your personal data. Your data may be shared with:</p>
                <ul>
                    <li><strong>Hosting provider</strong>: for secure data storage</li>
                    <li><strong>Email service</strong>: for sending transactional emails</li>
                    <li><strong>Authorities</strong>: if required by law</li>
                </ul>
            </section>
            
            <section>
                <h2>7. Data Security</h2>
                <p>We implement appropriate security measures:</p>
                <ul>
                    <li>SSL/TLS encryption for all communications</li>
                    <li>Password hashing with bcrypt</li>
                    <li>Restricted access to personal data</li>
                    <li>Regular secure backups</li>
                    <li>Intrusion monitoring and detection</li>
                </ul>
            </section>
            
            <section>
                <h2>8. Your Rights (GDPR)</h2>
                <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
                <ul>
                    <li><strong>Right of access</strong>: obtain a copy of your data</li>
                    <li><strong>Right to rectification</strong>: correct inaccurate data</li>
                    <li><strong>Right to erasure</strong>: delete your data ("right to be forgotten")</li>
                    <li><strong>Right to restriction</strong>: limit data processing</li>
                    <li><strong>Right to portability</strong>: receive your data in a structured format</li>
                    <li><strong>Right to object</strong>: object to processing</li>
                    <li><strong>Right to withdraw consent</strong>: withdraw your consent at any time</li>
                </ul>
                <p>To exercise these rights, contact us at: <a href="mailto:privacy@snowmanprod.fr">privacy@snowmanprod.fr</a></p>
            </section>
            
            <section>
                <h2>9. Cookies</h2>
                <h3>9.1 Cookies Used</h3>
                <table class="legal-table">
                    <thead>
                        <tr>
                            <th>Cookie</th>
                            <th>Type</th>
                            <th>Duration</th>
                            <th>Purpose</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>PHPSESSID</td>
                            <td>Essential</td>
                            <td>Session</td>
                            <td>Session management</td>
                        </tr>
                        <tr>
                            <td>snowshelf_theme</td>
                            <td>Preference</td>
                            <td>1 year</td>
                            <td>Chosen visual theme</td>
                        </tr>
                        <tr>
                            <td>snowshelf_lang</td>
                            <td>Preference</td>
                            <td>1 year</td>
                            <td>Preferred language</td>
                        </tr>
                        <tr>
                            <td>snowshelf_remember</td>
                            <td>Functional</td>
                            <td>30 days</td>
                            <td>Persistent login</td>
                        </tr>
                    </tbody>
                </table>
                
                <h3>9.2 Cookie Management</h3>
                <p>You can manage your cookie preferences through your browser settings.</p>
            </section>
            
            <section>
                <h2>10. International Transfers</h2>
                <p>Your data is stored on servers located in France/European Union. In case of transfers outside the EU, we ensure appropriate safeguards are in place.</p>
            </section>
            
            <section>
                <h2>11. Minors</h2>
                <p>The Service is not intended for persons under 16 years of age. If we learn that data from a minor has been collected, we will delete it immediately.</p>
            </section>
            
            <section>
                <h2>12. Changes</h2>
                <p>We may update this Privacy Policy. Any changes will be posted on this page with a new update date. Significant changes will be notified by email.</p>
            </section>
            
            <section>
                <h2>13. Complaint</h2>
                <p>If you believe your rights are not being respected, you can file a complaint with the CNIL (French Data Protection Authority): <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a></p>
            </section>
            
            <section>
                <h2>14. Contact</h2>
                <p>For any questions about this policy or your personal data:</p>
                <ul>
                    <li><strong>Email</strong>: privacy@snowmanprod.fr</li>
                    <li><strong>Data Protection Officer</strong>: dpo@snowmanprod.fr</li>
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
