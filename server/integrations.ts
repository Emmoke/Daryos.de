// Zugangsdaten für Verbindungen (Gemini, E-Mail, WhatsApp, Zwei-Faktor), die der Administrator in der Verwaltung einträgt.
// Sie werden nur auf dem Server gespeichert – verschlüsselt mit AES-256-GCM (Schlüssel aus CONFIG_ENCRYPTION_KEY) –
// und nie wieder an den Browser zurückgegeben. Eingetragene Werte haben Vorrang vor Server-Variablen.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { Backend } from './persistence';

export type IntegrationGroup = 'gemini' | 'email' | 'whatsapp';

export interface IntegrationField {
  key: string;
  label: string;
  secret?: boolean;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  pattern?: RegExp;
  patternError?: string;
}

export const INTEGRATION_FIELDS: Record<IntegrationGroup, IntegrationField[]> = {
  gemini: [
    { key: 'GEMINI_API_KEY', label: 'API-Schlüssel', secret: true, required: true, placeholder: 'AQ.… oder AIza…', hint: 'aistudio.google.com/apikey → „API-Schlüssel erstellen“', pattern: /^(AIza[0-9A-Za-z_-]{30,}|AQ\.[0-9A-Za-z_.-]{20,})$/, patternError: 'Ein Gemini-Schlüssel beginnt mit „AQ.“ oder „AIza“ – bitte nur den Schlüssel einfügen, ohne Leerzeichen.' },
    { key: 'GEMINI_MODEL', label: 'Modell (optional)', placeholder: 'gemini-2.5-flash', pattern: /^[a-z0-9.-]{3,60}$/, patternError: 'Ungültiger Modellname.' },
  ],
  email: [
    { key: 'SMTP_HOST', label: 'SMTP-Server', required: true, placeholder: 'smtp-relay.brevo.com', pattern: /^[a-z0-9.-]{3,253}$/i, patternError: 'Ungültiger Servername.' },
    { key: 'SMTP_PORT', label: 'Port', placeholder: '587', pattern: /^\d{2,5}$/, patternError: 'Nur Ziffern, z. B. 587.' },
    { key: 'SMTP_USER', label: 'Benutzer', placeholder: 'Login-Adresse bei Brevo' },
    { key: 'SMTP_PASS', label: 'Passwort / SMTP-Schlüssel', secret: true },
    { key: 'MAIL_FROM', label: 'Absender', required: true, placeholder: 'Daryos <info@daryos.de>', hint: 'Beim E-Mail-Dienst bestätigte Adresse' },
    { key: 'ADMIN_NOTIFY_EMAIL', label: 'Benachrichtigung an', required: true, placeholder: 'ihre@adresse.de', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternError: 'Ungültige E-Mail-Adresse.' },
  ],
  whatsapp: [
    { key: 'WHATSAPP_NUMBER', label: 'WhatsApp-Nummer (Chat-Link)', placeholder: '49176…', hint: 'Nur Ziffern mit Ländervorwahl – reicht für den Chat-Knopf auf der Webseite', pattern: /^\+?[\d ]{8,20}$/, patternError: 'Nur Ziffern mit Ländervorwahl, z. B. 49176…' },
    { key: 'WHATSAPP_ACCESS_TOKEN', label: 'Zugriffstoken (Bot)', secret: true, hint: 'Meta → System-Benutzer → Token mit whatsapp_business_messaging' },
    { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Telefonnummer-ID (Bot)', pattern: /^\d{5,30}$/, patternError: 'Nur Ziffern.' },
    { key: 'WHATSAPP_APP_SECRET', label: 'App-Geheimnis (Bot)', secret: true, hint: 'Meta-App → Einstellungen → Allgemein' },
    { key: 'WHATSAPP_VERIFY_TOKEN', label: 'Verify-Token (Bot)', secret: true, hint: 'Frei gewählt, mind. 16 Zeichen – dasselbe in Meta eintragen', pattern: /^.{16,200}$/, patternError: 'Mindestens 16 Zeichen.' },
  ],
};

/** Weitere Werte, die nicht über ein Formular, sondern über eigene Abläufe gesetzt werden */
const EXTRA_KEYS = ['ADMIN_TOTP_SECRET'];
const ALL_KEYS = new Set([...Object.values(INTEGRATION_FIELDS).flat().map((f) => f.key), ...EXTRA_KEYS]);

export class IntegrationError extends Error {
  constructor(message: string, readonly status = 400, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

const COLLECTION = 'integration_settings';
const DOC = 'values';

interface StoredDoc {
  key: string;
  iv: string;
  tag: string;
  data: string;
  updatedAt: string;
  updatedBy: string;
}

export function encryptionKeyFromEnv(env: NodeJS.ProcessEnv, isProd: boolean): Buffer | undefined {
  const raw = env.CONFIG_ENCRYPTION_KEY;
  if (raw && raw.length >= 16) return createHash('sha256').update(raw).digest();
  // Nur lokal: fester Entwicklungsschlüssel, damit man ohne Einrichtung testen kann
  if (!isProd) return createHash('sha256').update('daryos-lokale-entwicklung').digest();
  return undefined;
}

export class IntegrationStore {
  private values: Record<string, string> = {};
  private meta: { updatedAt?: string; updatedBy?: string } = {};
  private constructor(private readonly backend: Backend | undefined, private readonly key: Buffer | undefined) {}

  static async open(backend: Backend | undefined, key: Buffer | undefined) {
    const s = new IntegrationStore(backend, key);
    const doc = backend ? (await backend.loadAll<StoredDoc>(COLLECTION)).find((d) => d.key === DOC) : undefined;
    if (doc) {
      if (!key) {
        console.warn('[daryos] Gespeicherte Zugangsdaten vorhanden, aber CONFIG_ENCRYPTION_KEY fehlt – sie werden ignoriert.');
      } else {
        try {
          const d = createDecipheriv('aes-256-gcm', key, Buffer.from(doc.iv, 'base64'));
          d.setAuthTag(Buffer.from(doc.tag, 'base64'));
          const json = Buffer.concat([d.update(Buffer.from(doc.data, 'base64')), d.final()]).toString('utf8');
          s.values = JSON.parse(json);
          s.meta = { updatedAt: doc.updatedAt, updatedBy: doc.updatedBy };
        } catch {
          console.error('[daryos] Gespeicherte Zugangsdaten konnten nicht entschlüsselt werden (anderer CONFIG_ENCRYPTION_KEY?).');
        }
      }
    }
    return s;
  }

  /** Kann gespeichert werden? (Ohne Verschlüsselungsschlüssel im Produktivbetrieb nicht.) */
  get writable() {
    return !!this.key;
  }

  get(key: string) {
    return this.values[key];
  }

  /** Server-Variablen, überlagert von den in der Verwaltung eingetragenen Werten */
  merged(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    return { ...env, ...this.values };
  }

  /** Übersicht für die Verwaltung – Geheimnisse nur maskiert */
  describe(group: IntegrationGroup, env: NodeJS.ProcessEnv) {
    return INTEGRATION_FIELDS[group].map((f) => {
      const own = this.values[f.key];
      const server = env[f.key];
      const value = own ?? server;
      return {
        key: f.key,
        label: f.label,
        secret: !!f.secret,
        required: !!f.required,
        placeholder: f.placeholder,
        hint: f.hint,
        source: own !== undefined ? ('verwaltung' as const) : server ? ('server' as const) : null,
        // Geheimnisse: nur die letzten 4 Zeichen; normale Werte im Klartext (z. B. Servername)
        display: value ? (f.secret ? `•••• ${value.slice(-4)}` : value) : '',
      };
    });
  }

  /**
   * Übernimmt Formularwerte einer Gruppe. Leeres Geheimnis = unverändert lassen; `clear` enthält Felder, die entfernt werden sollen.
   */
  async update(group: IntegrationGroup, input: Record<string, unknown>, clear: string[], actor: string, now: Date) {
    if (!this.key) throw new IntegrationError('Speichern ist noch nicht möglich: Auf dem Server fehlt CONFIG_ENCRYPTION_KEY. Bitte einmal „bash scripts/cloudrun-deploy.sh“ ausführen – das richtet ihn automatisch ein.', 503);
    const next = { ...this.values };
    const errors: Record<string, string> = {};
    for (const f of INTEGRATION_FIELDS[group]) {
      if (clear.includes(f.key)) {
        delete next[f.key];
        continue;
      }
      const raw = input[f.key];
      if (typeof raw !== 'string') continue;
      const v = raw.trim();
      if (!v) {
        // Leeres normales Feld = entfernen; leeres Geheimnis = unverändert
        if (!f.secret) delete next[f.key];
        continue;
      }
      if (v.length > 2000) errors[f.key] = 'Zu lang.';
      else if (f.pattern && !f.pattern.test(f.key === 'GEMINI_API_KEY' ? v.replace(/\s/g, '') : v)) errors[f.key] = f.patternError ?? 'Ungültiger Wert.';
      else next[f.key] = f.key === 'GEMINI_API_KEY' || f.key === 'WHATSAPP_NUMBER' ? v.replace(/\s/g, '') : v;
    }
    if (Object.keys(errors).length) throw new IntegrationError('Bitte prüfen Sie die Angaben.', 400, errors);
    await this.persist(next, actor, now);
  }

  async setExtra(key: string, value: string | undefined, actor: string, now: Date) {
    if (!EXTRA_KEYS.includes(key)) throw new Error(`Unbekannter Schlüssel ${key}`);
    if (!this.key) throw new IntegrationError('Speichern ist noch nicht möglich: Auf dem Server fehlt CONFIG_ENCRYPTION_KEY. Bitte einmal „bash scripts/cloudrun-deploy.sh“ ausführen.', 503);
    const next = { ...this.values };
    if (value === undefined) delete next[key];
    else next[key] = value;
    await this.persist(next, actor, now);
  }

  get lastUpdate() {
    return { ...this.meta };
  }

  private async persist(next: Record<string, string>, actor: string, now: Date) {
    for (const k of Object.keys(next)) if (!ALL_KEYS.has(k)) delete next[k];
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', this.key!, iv);
    const data = Buffer.concat([c.update(JSON.stringify(next), 'utf8'), c.final()]);
    const doc: StoredDoc = { key: DOC, iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), data: data.toString('base64'), updatedAt: now.toISOString(), updatedBy: actor };
    await this.backend?.put(COLLECTION, DOC, doc);
    this.values = next;
    this.meta = { updatedAt: doc.updatedAt, updatedBy: actor };
  }
}
