// Datenhaltung für Kundenanfragen.
// RequestStore ist bewusst als Interface definiert: Für den Produktivbetrieb wird eine Firestore-Implementierung
// ergänzt; für Entwicklung und Tests genügen Datei- bzw. Speicherablage.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type { ComparisonInput, ComparisonResult, RequestStatus, StatusHistoryEntry } from '../shared/platform';
import type { ContactInput } from './validation';

export interface AdminSummary {
  generatedAt: string;
  generatedBy: 'system' | 'gemini';
  text: string;
  missingInformation: string[];
  warnings: string[];
}

export interface DraftDocument {
  id: string;
  createdAt: string;
  createdBy: 'system' | 'gemini';
  kind: 'email_to_customer';
  subject: string;
  body: string;
  /** Entwürfe werden nie automatisch versendet. */
  approvedBy?: string;
}

export interface NotificationLog {
  at: string;
  channel: 'email' | 'whatsapp';
  recipient: 'admin' | 'customer';
  status: 'sent' | 'not_configured' | 'failed';
  detail: string;
}

export interface RequestRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RequestStatus;
  history: StatusHistoryEntry[];
  input: ComparisonInput;
  comparison: ComparisonResult | null;
  selectedOfferId?: string;
  contact?: ContactInput & { consentAt: string };
  summary?: AdminSummary;
  drafts: DraftDocument[];
  notifications: NotificationLog[];
  /** Hash aus Kontakt + Angebot zur Erkennung doppelter Anfragen */
  contactFingerprint?: string;
  deleteAfter: string;
}

export interface RequestStore {
  create(record: RequestRecord): Promise<void>;
  get(id: string): Promise<RequestRecord | undefined>;
  update(id: string, mutate: (r: RequestRecord) => void): Promise<RequestRecord | undefined>;
  list(filter?: { status?: RequestStatus }): Promise<RequestRecord[]>;
  findByFingerprint(fingerprint: string, sinceIso: string): Promise<RequestRecord | undefined>;
  purgeExpired(now: Date): Promise<number>;
}

// Ohne leicht verwechselbare Zeichen (0/O, 1/I/L)
const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Nicht erratbare, gut vorlesbare Anfrage-ID, z. B. DY-7KQ4-M2XP-9WHT */
export function newRequestId(): string {
  const bytes = randomBytes(12);
  let s = '';
  for (const b of bytes) s += ID_ALPHABET[b % ID_ALPHABET.length];
  return `DY-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export const REQUEST_ID_PATTERN = /^DY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export class MemoryRequestStore implements RequestStore {
  protected records = new Map<string, RequestRecord>();

  async create(record: RequestRecord) {
    if (this.records.has(record.id)) throw new Error('Doppelte Anfrage-ID');
    this.records.set(record.id, structuredClone(record));
    await this.persist();
  }

  async get(id: string) {
    const r = this.records.get(id);
    return r ? structuredClone(r) : undefined;
  }

  async update(id: string, mutate: (r: RequestRecord) => void) {
    const current = this.records.get(id);
    if (!current) return undefined;
    const draft = structuredClone(current);
    mutate(draft); // wirft bei ungültigem Statuswechsel – dann bleibt der alte Stand erhalten
    this.records.set(id, draft);
    await this.persist();
    return structuredClone(draft);
  }

  async list(filter?: { status?: RequestStatus }) {
    return [...this.records.values()]
      .filter((r) => !filter?.status || r.status === filter.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => structuredClone(r));
  }

  async findByFingerprint(fingerprint: string, sinceIso: string) {
    for (const r of this.records.values()) {
      if (r.contactFingerprint === fingerprint && r.updatedAt >= sinceIso) return structuredClone(r);
    }
    return undefined;
  }

  async purgeExpired(now: Date) {
    const iso = now.toISOString();
    let removed = 0;
    for (const [id, r] of this.records) {
      if (r.deleteAfter < iso) {
        this.records.delete(id);
        removed++;
      }
    }
    if (removed) await this.persist();
    return removed;
  }

  protected async persist(): Promise<void> {}
}

/** Speichert alle Anfragen als JSON-Datei (atomar über temporäre Datei). Nur für Prototyp/Einzelserver geeignet. */
export class FileRequestStore extends MemoryRequestStore {
  private writing: Promise<void> = Promise.resolve();

  private constructor(private readonly file: string) {
    super();
  }

  static async open(file: string): Promise<FileRequestStore> {
    const store = new FileRequestStore(file);
    try {
      const data = JSON.parse(await fs.readFile(file, 'utf8')) as RequestRecord[];
      for (const r of data) store.records.set(r.id, r);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    return store;
  }

  protected persist(): Promise<void> {
    const snapshot = JSON.stringify([...this.records.values()], null, 2);
    // .catch: ein fehlgeschlagener Schreibvorgang darf nachfolgende nicht dauerhaft blockieren
    this.writing = this.writing.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, this.file);
    });
    return this.writing;
  }
}
