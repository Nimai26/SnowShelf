import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('SMTP_FROM') || 'noreply@snowshelf.fr';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '1025', 10),
      secure: smtpSecure, // true pour TLS (port 465), false pour dev (MailHog)
      auth: this.getAuth(),
    });

    this.logger.log(`📧 Mail service initialisé (SMTP: ${this.configService.get('SMTP_HOST')}:${this.configService.get('SMTP_PORT')}, secure: ${smtpSecure})`);
  }

  private getAuth(): { user: string; pass: string } | undefined {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    if (user && pass) {
      return { user, pass };
    }
    return undefined;
  }

  // ──────────────────────────────────────────────
  // EMAIL DE VÉRIFICATION
  // ──────────────────────────────────────────────
  async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #38bdf8; font-size: 28px; margin: 0;">❄️ SnowShelf</h1>
        </div>

        <!-- Card -->
        <div style="background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px 0;">
            Bienvenue, ${username} ! 👋
          </h2>
          
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Merci de vous être inscrit sur SnowShelf. Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
          </p>

          <!-- Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; background-color: #38bdf8; color: #0f172a; font-weight: 600; 
                      padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
              ✅ Vérifier mon email
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
            Ou copiez ce lien dans votre navigateur :
          </p>
          <p style="color: #38bdf8; font-size: 13px; word-break: break-all; margin: 0 0 24px 0;">
            ${verifyUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">

          <p style="color: #64748b; font-size: 13px; margin: 0;">
            Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte sur SnowShelf, vous pouvez ignorer cet email.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #475569; font-size: 13px; margin: 0;">
            Made with ❤️ by Nimai — SnowShelf v2
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"SnowShelf" <${this.fromAddress}>`,
        to: email,
        subject: '❄️ SnowShelf — Vérifiez votre adresse email',
        html,
      });

      this.logger.log(`📧 Email de vérification envoyé à ${email}`);
    } catch (error) {
      this.logger.error(`❌ Échec envoi email de vérification à ${email}`, error.stack);
    }
  }

  // ──────────────────────────────────────────────
  // EMAIL DE RÉINITIALISATION MOT DE PASSE
  // ──────────────────────────────────────────────
  async sendResetPasswordEmail(email: string, username: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #38bdf8; font-size: 28px; margin: 0;">❄️ SnowShelf</h1>
        </div>

        <!-- Card -->
        <div style="background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 16px 0;">
            Réinitialisation du mot de passe 🔑
          </h2>

          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            Bonjour <strong style="color: #f1f5f9;">${username}</strong>,
          </p>
          
          <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.
          </p>

          <!-- Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: 600; 
                      padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
              🔑 Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
            Ou copiez ce lien dans votre navigateur :
          </p>
          <p style="color: #f59e0b; font-size: 13px; word-break: break-all; margin: 0 0 24px 0;">
            ${resetUrl}
          </p>

          <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">

          <p style="color: #64748b; font-size: 13px; margin: 0;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email — votre mot de passe restera inchangé.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #475569; font-size: 13px; margin: 0;">
            Made with ❤️ by Nimai — SnowShelf v2
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"SnowShelf" <${this.fromAddress}>`,
        to: email,
        subject: '🔑 SnowShelf — Réinitialisation de votre mot de passe',
        html,
      });

      this.logger.log(`📧 Email de réinitialisation envoyé à ${email}`);
    } catch (error) {
      this.logger.error(`❌ Échec envoi email de réinitialisation à ${email}`, error.stack);
    }
  }

  // ──────────────────────────────────────────────
  // EMAIL NEWSLETTER
  // ──────────────────────────────────────────────
  async sendNewsletterEmail(email: string, username: string, title: string, content: string): Promise<void> {
    // Basic markdown to HTML conversion
    const htmlContent = content
      .split('\n')
      .map((line) => {
        if (line.startsWith('### ')) return `<h3 style="color: #f1f5f9; font-size: 16px; margin: 16px 0 8px 0;">${line.slice(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2 style="color: #f1f5f9; font-size: 18px; margin: 20px 0 8px 0;">${line.slice(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1 style="color: #f1f5f9; font-size: 22px; margin: 24px 0 8px 0;">${line.slice(2)}</h1>`;
        if (line.startsWith('- ')) return `<li style="color: #94a3b8; margin: 4px 0;">${line.slice(2)}</li>`;
        if (line.startsWith('---')) return `<hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;">`;
        if (line.trim() === '') return '<br>';
        return `<p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 8px 0;">${line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f1f5f9;">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`;
      })
      .join('\n');

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #38bdf8; font-size: 28px; margin: 0;">❄️ SnowShelf</h1>
        </div>

        <!-- Card -->
        <div style="background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
          <h2 style="color: #f1f5f9; font-size: 22px; margin: 0 0 8px 0;">
            📰 ${title}
          </h2>

          <p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0;">
            Bonjour <strong style="color: #f1f5f9;">${username}</strong>,
          </p>

          <div>
            ${htmlContent}
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${this.frontendUrl}/newsletters"
               style="display: inline-block; background-color: #38bdf8; color: #0f172a; font-weight: 600;
                      padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">
              📖 Lire sur SnowShelf
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #475569; font-size: 12px; margin: 0;">
            Vous recevez cet email car vous êtes abonné à la newsletter SnowShelf.<br>
            Pour vous désabonner, rendez-vous dans les paramètres de votre profil.
          </p>
          <p style="color: #475569; font-size: 13px; margin: 12px 0 0 0;">
            Made with ❤️ by Nimai — SnowShelf v2
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"SnowShelf" <${this.fromAddress}>`,
        to: email,
        subject: `📰 SnowShelf — ${title}`,
        html,
      });

      this.logger.log(`📧 Newsletter envoyée à ${email}`);
    } catch (error) {
      this.logger.error(`❌ Échec envoi newsletter à ${email}`, error.stack);
    }
  }
}
