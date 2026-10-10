// Datenhaltung für Kundenanfragen. Gespeichert wird über ein Backend (Dateien oder Cloud Firestore, siehe persistence.ts).
import { randomBytes } from 'node:crypto';
import type { Backend } from './persistence';
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
  /** Angebot, auf das sich der Entwurf bezieht */
  offerId?: string;
  offerIsDemo?: boolean;
  editedAt?: string;
  sentAt?: string;
  sentTo?: string;
  sentBy?: string;
}

/** Vom Kunden hochgeladene Unterlage; die Datei selbst liegt im Dateispeicher (files.ts) */
export interface CustomerDocument {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  storageKey: string;
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
  documents?: CustomerDocument[];
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

const COLLECTION = 'requests';

/**
 * Hält Anfragen im Arbeitsspeicher und schreibt jede Änderung zuerst ins Backend.
 * Erst wenn das Speichern geklappt hat, wird der Arbeitsspeicher aktualisiert – so weichen beide nie voneinander ab.
 * Ohne Backend (Tests) wird nichts dauerhaft gespeichert.
 */
export class MemoryRequestStore implements RequestStore {
  protected records = new Map<string, RequestRecord>();

  constructor(private readonly backend?: Backend) {}

  static async open(backend: Backend): Promise<MemoryRequestStore> {
    const store = new MemoryRequestStore(backend);
    for (const r of await backend.loadAll<RequestRecord>(COLLECTION)) store.records.set(r.id, r);
    return store;
  }

  async create(record: RequestRecord) {
    if (this.records.has(record.id)) throw new Error('Doppelte Anfrage-ID');
    await this.backend?.put(COLLECTION, record.id, record);
    this.records.set(record.id, structuredClone(record));
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
    await this.backend?.put(COLLECTION, id, draft);
    this.records.set(id, draft);
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
    for (const [id, r] of [...this.records]) {
      if (r.deleteAfter < iso) {
        await this.backend?.remove(COLLECTION, id);
        this.records.delete(id);
        removed++;
      }
    }
    return removed;
  }
}
