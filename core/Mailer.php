<?php
/**
 * SnowShelf - Classe Mailer
 * 
 * Encapsulation de PHPMailer pour l'envoi d'emails
 * avec support multi-langues.
 */

require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    /** @var PHPMailer Instance PHPMailer */
    private PHPMailer $mail;

    /** @var array Configuration SMTP */
    private array $config;

    /** @var string Langue pour les templates */
    private string $lang;

    /**
     * Constructeur
     * 
     * @param string $lang Code langue (fr, en, etc.)
     */
    public function __construct(string $lang = 'fr')
    {
        $this->lang = $lang;
        $this->loadConfig();
        $this->initMailer();
    }

    /**
     * Charge la configuration SMTP depuis .env
     */
    private function loadConfig(): void
    {
        // Charger les variables d'environnement si pas déjà fait
        $envFile = dirname(__DIR__) . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0) continue;
                if (strpos($line, '=') === false) continue;
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (!isset($_ENV[$key])) {
                    $_ENV[$key] = $value;
                }
            }
        }

        $this->config = [
            'host' => $_ENV['SMTP_HOST'] ?? 'localhost',
            'port' => (int)($_ENV['SMTP_PORT'] ?? 587),
            'user' => $_ENV['SMTP_USER'] ?? '',
            'pass' => $_ENV['SMTP_PASS'] ?? '',
            'from' => $_ENV['SMTP_FROM'] ?? 'noreply@snowmanprod.fr',
            'from_name' => $_ENV['SMTP_FROM_NAME'] ?? 'SnowShelf',
        ];
    }

    /**
     * Initialise PHPMailer avec la config SMTP
     */
    private function initMailer(): void
    {
        $this->mail = new PHPMailer(true);

        // Configuration SMTP
        $this->mail->isSMTP();
        $this->mail->Host = $this->config['host'];
        $this->mail->SMTPAuth = true;
        $this->mail->Username = $this->config['user'];
        $this->mail->Password = $this->config['pass'];
        $this->mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mail->Port = $this->config['port'];

        // Configuration générale
        $this->mail->CharSet = 'UTF-8';
        $this->mail->Encoding = 'base64';
        $this->mail->setFrom($this->config['from'], $this->config['from_name']);

        // Désactiver le debug en production
        $this->mail->SMTPDebug = SMTP::DEBUG_OFF;
    }

    /**
     * Envoie un email de vérification d'adresse
     * 
     * @param string $to Adresse email du destinataire
     * @param string $username Nom d'utilisateur
     * @param string $token Token de vérification
     * @return bool Succès de l'envoi
     */
    public function sendVerificationEmail(string $to, string $username, string $token): bool
    {
        try {
            // Charger le système i18n si disponible
            $translations = $this->getEmailTranslations();

            // Construire l'URL de vérification
            $baseUrl = $this->getBaseUrl();
            $verifyUrl = $baseUrl . '/verify-email.php?token=' . urlencode($token);

            // Sujet
            $subject = $translations['verification_subject'] ?? 'Verify your email address';

            // Corps HTML
            $body = $this->buildVerificationEmailHtml($username, $verifyUrl, $translations);

            // Corps texte (fallback)
            $altBody = $this->buildVerificationEmailText($username, $verifyUrl, $translations);

            // Envoi
            $this->mail->clearAddresses();
            $this->mail->addAddress($to, $username);
            $this->mail->isHTML(true);
            $this->mail->Subject = $subject;
            $this->mail->Body = $body;
            $this->mail->AltBody = $altBody;

            return $this->mail->send();

        } catch (Exception $e) {
            error_log('Mailer Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie un email de réinitialisation de mot de passe
     * 
     * @param string $to Adresse email
     * @param string $username Nom d'utilisateur
     * @param string $token Token de réinitialisation
     * @return bool Succès de l'envoi
     */
    public function sendPasswordResetEmail(string $to, string $username, string $token): bool
    {
        try {
            $translations = $this->getEmailTranslations();
            $baseUrl = $this->getBaseUrl();
            $resetUrl = $baseUrl . '/reset-password.php?token=' . urlencode($token);

            $subject = $translations['reset_subject'] ?? 'Reset your password';
            $body = $this->buildPasswordResetEmailHtml($username, $resetUrl, $translations);
            $altBody = $this->buildPasswordResetEmailText($username, $resetUrl, $translations);

            $this->mail->clearAddresses();
            $this->mail->addAddress($to, $username);
            $this->mail->isHTML(true);
            $this->mail->Subject = $subject;
            $this->mail->Body = $body;
            $this->mail->AltBody = $altBody;

            return $this->mail->send();

        } catch (Exception $e) {
            error_log('Mailer Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupère les traductions pour les emails
     */
    private function getEmailTranslations(): array
    {
        $langFile = dirname(__DIR__) . '/lang/' . $this->lang . '.php';
        
        if (file_exists($langFile)) {
            $translations = require $langFile;
            return $translations['emails'] ?? [];
        }

        // Fallback français
        return [
            'verification_subject' => 'Confirmez votre adresse email',
            'verification_greeting' => 'Bonjour',
            'verification_intro' => 'Merci de vous être inscrit sur SnowShelf !',
            'verification_instruction' => 'Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :',
            'verification_button' => 'Vérifier mon email',
            'verification_expire' => 'Ce lien expire dans 24 heures.',
            'verification_ignore' => 'Si vous n\'avez pas créé de compte, ignorez simplement cet email.',
            'reset_subject' => 'Réinitialisation de votre mot de passe',
            'reset_greeting' => 'Bonjour',
            'reset_intro' => 'Vous avez demandé la réinitialisation de votre mot de passe.',
            'reset_instruction' => 'Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :',
            'reset_button' => 'Réinitialiser le mot de passe',
            'reset_expire' => 'Ce lien expire dans 1 heure.',
            'reset_ignore' => 'Si vous n\'avez pas fait cette demande, ignorez cet email.',
            'footer_text' => 'Cet email a été envoyé automatiquement par SnowShelf.',
        ];
    }

    /**
     * Récupère l'URL de base du site
     */
    private function getBaseUrl(): string
    {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'snowshelf.fr';
        return $protocol . '://' . $host;
    }

    /**
     * Construit le HTML de l'email de vérification
     */
    private function buildVerificationEmailHtml(string $username, string $verifyUrl, array $t): string
    {
        $greeting = $t['verification_greeting'] ?? 'Bonjour';
        $intro = $t['verification_intro'] ?? 'Merci de vous être inscrit !';
        $instruction = $t['verification_instruction'] ?? 'Cliquez pour vérifier :';
        $button = $t['verification_button'] ?? 'Vérifier';
        $expire = $t['verification_expire'] ?? 'Lien valide 24h.';
        $ignore = $t['verification_ignore'] ?? 'Ignorez si non sollicité.';
        $footer = $t['footer_text'] ?? 'Email automatique.';

        return $this->getEmailTemplate(
            "{$greeting} {$username},",
            "<p>{$intro}</p><p>{$instruction}</p>",
            $verifyUrl,
            $button,
            "<p style='font-size: 13px; color: #888;'>{$expire}</p><p style='font-size: 13px; color: #888;'>{$ignore}</p>",
            $footer
        );
    }

    /**
     * Construit le texte brut de l'email de vérification
     */
    private function buildVerificationEmailText(string $username, string $verifyUrl, array $t): string
    {
        $greeting = $t['verification_greeting'] ?? 'Bonjour';
        $intro = $t['verification_intro'] ?? 'Merci de vous être inscrit !';
        $instruction = $t['verification_instruction'] ?? 'Cliquez pour vérifier :';
        $expire = $t['verification_expire'] ?? 'Lien valide 24h.';
        $ignore = $t['verification_ignore'] ?? 'Ignorez si non sollicité.';

        return "{$greeting} {$username},\n\n"
            . "{$intro}\n\n"
            . "{$instruction}\n"
            . "{$verifyUrl}\n\n"
            . "{$expire}\n"
            . "{$ignore}\n\n"
            . "-- SnowShelf";
    }

    /**
     * Construit le HTML de l'email de réinitialisation
     */
    private function buildPasswordResetEmailHtml(string $username, string $resetUrl, array $t): string
    {
        $greeting = $t['reset_greeting'] ?? 'Bonjour';
        $intro = $t['reset_intro'] ?? 'Demande de réinitialisation.';
        $instruction = $t['reset_instruction'] ?? 'Cliquez pour réinitialiser :';
        $button = $t['reset_button'] ?? 'Réinitialiser';
        $expire = $t['reset_expire'] ?? 'Lien valide 1h.';
        $ignore = $t['reset_ignore'] ?? 'Ignorez si non sollicité.';
        $footer = $t['footer_text'] ?? 'Email automatique.';

        return $this->getEmailTemplate(
            "{$greeting} {$username},",
            "<p>{$intro}</p><p>{$instruction}</p>",
            $resetUrl,
            $button,
            "<p style='font-size: 13px; color: #888;'>{$expire}</p><p style='font-size: 13px; color: #888;'>{$ignore}</p>",
            $footer
        );
    }

    /**
     * Construit le texte brut de l'email de réinitialisation
     */
    private function buildPasswordResetEmailText(string $username, string $resetUrl, array $t): string
    {
        $greeting = $t['reset_greeting'] ?? 'Bonjour';
        $intro = $t['reset_intro'] ?? 'Demande de réinitialisation.';
        $instruction = $t['reset_instruction'] ?? 'Cliquez pour réinitialiser :';
        $expire = $t['reset_expire'] ?? 'Lien valide 1h.';
        $ignore = $t['reset_ignore'] ?? 'Ignorez si non sollicité.';

        return "{$greeting} {$username},\n\n"
            . "{$intro}\n\n"
            . "{$instruction}\n"
            . "{$resetUrl}\n\n"
            . "{$expire}\n"
            . "{$ignore}\n\n"
            . "-- SnowShelf";
    }

    /**
     * Template HTML commun pour tous les emails
     */
    private function getEmailTemplate(
        string $title,
        string $content,
        string $buttonUrl,
        string $buttonText,
        string $footer,
        string $copyright
    ): string {
        return <<<HTML
<!DOCTYPE html>
<html lang="{$this->lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a2e;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background: linear-gradient(135deg, rgba(38, 92, 116, 0.9), rgba(11, 49, 97, 0.9)); border-radius: 16px; overflow: hidden;">
                    <!-- Header avec logo -->
                    <tr>
                        <td align="center" style="padding: 30px 40px 20px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">❄️ SnowShelf</h1>
                        </td>
                    </tr>
                    
                    <!-- Contenu principal -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 20px;">{$title}</h2>
                            <div style="color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                                {$content}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Bouton CTA -->
                    <tr>
                        <td align="center" style="padding: 20px 40px;">
                            <a href="{$buttonUrl}" style="display: inline-block; background: linear-gradient(135deg, #12afa0, #009688); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(18, 175, 160, 0.4);">
                                {$buttonText}
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Lien de secours -->
                    <tr>
                        <td style="padding: 10px 40px 30px;">
                            <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                                Si le bouton ne fonctionne pas, copiez ce lien :<br>
                                <a href="{$buttonUrl}" style="color: #12afa0; word-break: break-all;">{$buttonUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer du contenu -->
                    <tr>
                        <td style="padding: 0 40px 30px; text-align: center;">
                            {$footer}
                        </td>
                    </tr>
                </table>
                
                <!-- Copyright -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                    <tr>
                        <td style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                            {$copyright}<br>
                            © 2025 SnowShelf - Snowman Prod
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
