// Vertragspartner von Daryos: Anbieter, Maklerpools oder Vergleichsportale, mit denen ein Vermittlungsvertrag besteht.
// Hier steht, wo Anträge eingereicht werden (Portal-Link) und unter welcher Partnernummer. Anträge werden dort
// von Daryos selbst eingereicht – ein automatischer Vertragsabschluss findet nicht statt.
import { randomUUID } from 'node:crypto';
import type { Backend } from './persistence';

export interface Partner {
  id: string;
  name: string;
  kind: 'direkt' | 'maklerpool' | 'portal';
  energyTypes: ('strom' | 'gas')[];
  /** Hier stellt Daryos die Anträge (Partner-/Maklerportal) */
  portalUrl: string;
  /** Optional: Partner-/Empfehlungslink für Kunden; Platzhalter {plz} und {kwh} werden ersetzt */
  customerLink?: string;
  partnerNumber?: string;
  contractSince?: string;
  commissionNote?: string;
  contact?: string;
  /** Welche Angaben verlangt dieser Partner zusätzlich? (frei, z. B. „Zählerstand bei Umzug“) */
  requirements?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export const PARTNER_KINDS: Record<Partner['kind'], string> = { direkt: 'Direkt beim Anbieter', maklerpool: 'Maklerpool', portal: 'Vergleichs-/Partnerportal' };

export class PartnerError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}, readonly status = 400) {
    super(message);
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const https = (v: string) => /^https:\/\/[^\s]+$/.test(v);

export function validatePartner(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const e: Record<string, string> = {};
  const name = str(b.name, 100);
  if (name.length < 2) e.name = 'Name fehlt.';
  const kind = (['direkt', 'maklerpool', 'portal'] as const).find((k) => k === b.kind);
  if (!kind) e.kind = 'Art wählen.';
  const energyTypes = (Array.isArray(b.energyTypes) ? b.energyTypes : []).filter((x): x is 'strom' | 'gas' => x === 'strom' || x === 'gas');
  if (!energyTypes.length) e.energyTypes = 'Mindestens Strom oder Gas.';
  const portalUrl = str(b.portalUrl, 500);
  if (!https(portalUrl)) e.portalUrl = 'Portal-Link mit https:// angeben.';
  const customerLink = str(b.customerLink, 500) || undefined;
  if (customerLink && !https(customerLink)) e.customerLink = 'Link muss mit https:// beginnen.';
  const contractSince = str(b.contractSince, 10) || undefined;
  if (contractSince && !/^\d{4}-\d{2}-\d{2}$/.test(contractSince)) e.contractSince = 'Datum ungültig.';
  if (Object.keys(e).length) throw new PartnerError('Bitte prüfen Sie die Angaben.', e);
  return {
    name,
    kind: kind!,
    energyTypes,
    portalUrl,
    customerLink,
    partnerNumber: str(b.partnerNumber, 60) || undefined,
    contractSince,
    commissionNote: str(b.commissionNote, 300) || undefined,
    contact: str(b.contact, 300) || undefined,
    requirements: str(b.requirements, 1000) || undefined,
    notes: str(b.notes, 1000) || undefined,
    active: b.active !== false,
  };
}

/** Kunden-Link mit PLZ und Verbrauch füllen (nur Ziffern werden eingesetzt) */
export function fillCustomerLink(template: string, postalCode: string, kwh: number) {
  return template.replace(/\{plz\}/g, encodeURIComponent(postalCode.replace(/\D/g, ''))).replace(/\{kwh\}/g, String(Math.round(kwh)));
}

export class PartnerStore {
  private partners = new Map<string, Partner>();
  private constructor(private readonly backend?: Backend, private readonly now: () => Date = () => new Date()) {}

  static async open(backend?: Backend, now?: () => Date) {
    const s = new PartnerStore(backend, now);
    if (backend) for (const p of await backend.loadAll<Partner>('partners')) s.partners.set(p.id, p);
    return s;
  }

  list() {
    return [...this.partners.values()].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((p) => structuredClone(p));
  }

  get(id: string | undefined) {
    const p = id ? this.partners.get(id) : undefined;
    return p ? structuredClone(p) : undefined;
  }

  async create(body: unknown, actor: string) {
    const iso = this.now().toISOString();
    const p: Partner = { id: randomUUID(), ...validatePartner(body), createdAt: iso, updatedAt: iso, updatedBy: actor };
    await this.backend?.put('partners', p.id, p);
    this.partners.set(p.id, p);
    return structuredClone(p);
  }

  async update(id: string, body: unknown, actor: string) {
    const cur = this.partners.get(id);
    if (!cur) throw new PartnerError('Partner nicht gefunden.', {}, 404);
    const p: Partner = { ...cur, ...validatePartner(body), updatedAt: this.now().toISOString(), updatedBy: actor };
    await this.backend?.put('partners', id, p);
    this.partners.set(id, p);
    return structuredClone(p);
  }

  async remove(id: string) {
    if (!this.partners.has(id)) throw new PartnerError('Partner nicht gefunden.', {}, 404);
    await this.backend?.remove('partners', id);
    this.partners.delete(id);
  }
}
