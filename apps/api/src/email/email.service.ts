import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    this.resend = key ? new Resend(key) : null;
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM');
    const webAppUrl = this.getWebAppBaseUrl();
    if (!from || !webAppUrl || !this.resend) {
      this.log.warn('Email not configured; skipping verification email');
      return;
    }

    const appName = this.getAppName();
    const link = `${webAppUrl}/verify-email?token=${encodeURIComponent(token)}`;

    const { error } = await this.resend.emails.send({
      from,
      to,
      subject: `Verify your ${appName} email`,
      html: EmailService.baseTemplate({
        appName,
        title: 'Verify your email',
        preview: `Confirm your ${appName} account.`,
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6">
            Thanks for signing up. Tap the button below to confirm your email address.
          </p>`,
        ctaUrl: link,
        ctaLabel: 'Verify email address',
        footer: `If you did not create a ${appName} account, you can safely ignore this email.`,
      }),
    });

    if (error) {
      this.log.error(
        `Verification email failed: ${error.message ?? String(error)}`,
      );
      throw new Error('Could not send verification email');
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM');
    const webAppUrl = this.getWebAppBaseUrl();
    if (!from || !webAppUrl || !this.resend) {
      this.log.warn('Email not configured; skipping password reset email');
      return;
    }

    const appName = this.getAppName();
    const link = `${webAppUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const { error } = await this.resend.emails.send({
      from,
      to,
      subject: `Reset your ${appName} password`,
      html: EmailService.baseTemplate({
        appName,
        title: 'Reset your password',
        preview: `Use this link to reset your ${appName} password.`,
        body: `
          <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6">
            We received a request to reset the password for your account.
            This link expires in one hour.
          </p>`,
        ctaUrl: link,
        ctaLabel: 'Reset password',
        footer: `If you did not request a password reset, you can safely ignore this email.`,
      }),
    });

    if (error) {
      this.log.error(
        `Password reset email failed: ${error.message ?? String(error)}`,
      );
      throw new Error('Could not send password reset email');
    }
  }

  private getAppName(): string {
    return this.config.get<string>('APP_NAME')?.trim() || 'App';
  }

  private getWebAppBaseUrl(): string {
    const raw =
      this.config.get<string>('WEB_APP_URL') ??
      this.config.get<string>('PUBLIC_WEB_APP_URL') ??
      '';
    return raw.replace(/\/$/, '');
  }

  private static baseTemplate(opts: {
    appName: string;
    title: string;
    preview: string;
    body: string;
    ctaUrl: string;
    ctaLabel: string;
    footer: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${EmailService.escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${EmailService.escapeHtml(opts.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:24px">
              <span style="font-size:22px;font-weight:700;color:#111827">${EmailService.escapeHtml(opts.appName)}</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111827">${EmailService.escapeHtml(opts.title)}</h1>
              ${opts.body}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
                <tr>
                  <td style="border-radius:8px;background:#111827">
                    <a href="${opts.ctaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${EmailService.escapeHtml(opts.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-size:12px;color:#9ca3af">${EmailService.escapeHtml(opts.footer)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
