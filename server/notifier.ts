// Benachrichtigungen. Ohne SMTP-Konfiguration wird nichts versendet und der Status "not_configured" protokolliert –
// es werden keine Nachrichten vorgetäuscht.
import nodemailer from 'nodemailer';
import type { NotificationLog } from './store';

export interface Notifier {
  readonly configured: boolean;
  readonly detail: string;
  notifyAdminNewRequest(requestId: string, adminUrl: string): Promise<NotificationLog>;
  /** Nur nach ausdrücklicher Freigabe durch den Administrator aufrufen. */
  sendCustomerEmail(to: string, subject: string, text: string): Promise<NotificationLog>;
}

export class SmtpNotifier implements Notifier {
  async sendCustomerEmail(to: string, subject: string, text: string): Promise<NotificationLog> {
    const at = new Date().toISOString();
    try {
      await this.transport.sendMail({ from: this.cfg.from, to, replyTo: this.cfg.adminTo, subject, text });
      return { at, channel: 'email', recipient: 'customer', status: 'sent', detail: `an ${to}` };
    } catch (err) {
      return { at, channel: 'email', recipient: 'customer', status: 'failed', detail: (err as Error).message.slice(0, 200) };
    }
  }

  readonly configured = true;
  readonly detail: string;
  private transport: nodemailer.Transporter;

  constructor(private readonly cfg: { host: string; port: number; user?: string; pass?: string; from: string; adminTo: string }) {
    this.transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
    this.detail = `SMTP ${cfg.host}:${cfg.port} → ${cfg.adminTo}`;
  }

  async notifyAdminNewRequest(requestId: string, adminUrl: string): Promise<NotificationLog> {
    const at = new Date().toISOString();
    try {
      // Bewusst ohne personenbezogene Daten in der E-Mail: nur ID und Link ins geschützte Dashboard.
      await this.transport.sendMail({
        from: this.cfg.from,
        to: this.cfg.adminTo,
        subject: `Neue Kundenanfrage ${requestId} wartet auf Prüfung`,
        text: `Eine neue Anfrage wartet auf Ihre Prüfung.\n\nAnfrage-ID: ${requestId}\nDashboard: ${adminUrl}\n\nBitte melden Sie sich im Daryos-Dashboard an, um die Details zu sehen.`,
      });
      return { at, channel: 'email', recipient: 'admin', status: 'sent', detail: `an ${this.cfg.adminTo}` };
    } catch (err) {
      return { at, channel: 'email', recipient: 'admin', status: 'failed', detail: (err as Error).message.slice(0, 200) };
    }
  }
}

export class DisabledNotifier implements Notifier {
  async sendCustomerEmail(): Promise<NotificationLog> {
    return { at: new Date().toISOString(), channel: 'email', recipient: 'customer', status: 'not_configured', detail: this.detail };
  }

  readonly configured = false;
  readonly detail = 'E-Mail-Versand nicht eingerichtet (SMTP_HOST, MAIL_FROM, ADMIN_NOTIFY_EMAIL fehlen).';
  async notifyAdminNewRequest(): Promise<NotificationLog> {
    return { at: new Date().toISOString(), channel: 'email', recipient: 'admin', status: 'not_configured', detail: this.detail };
  }
}

export function notifierFromEnv(env: NodeJS.ProcessEnv): Notifier {
  if (env.SMTP_HOST && env.MAIL_FROM && env.ADMIN_NOTIFY_EMAIL) {
    return new SmtpNotifier({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.MAIL_FROM,
      adminTo: env.ADMIN_NOTIFY_EMAIL,
    });
  }
  return new DisabledNotifier();
}
