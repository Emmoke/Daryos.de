// Tarifkatalog: Von Daryos selbst gepflegte, echte Tarifangebote (z. B. aus dem Maklerpool oder Anbieterportal).
// Jeder Tarif trägt seine Quelle und einen Gültigkeitszeitraum – abgelaufene Tarife erscheinen nicht mehr.
// Sobald mindestens ein aktiver Tarif gepflegt ist, ersetzt der Katalog die DEMO-Daten vollständig.
import { randomUUID } from 'node:crypto';
import type { ComparisonInput, EnergyType, Offer } from '../shared/platform';
import type { Backend } from './persistence';
import type { OfferFetchResult, OfferProvider, OfferProviderInfo } from './offers/OfferProvider';

export interface Tariff {
  id: string;
  energyType: EnergyType;
  providerName: string;
  tariffName: string;
  workPriceCtPerKwh: number;
  basePriceEurPerMonth: number;
  priceGuaranteeMonths: number;
  priceGuaranteeType?: string;
  contractTermMonths: number;
  noticePeriodWeeks: number;
  eco: boolean;
  bonusEur?: number;
  bonusConditions?: string;
  /** PLZ-Gebiete, z. B. ["04", "06846"]; leer = bundesweit */
  postalCodes: string[];
  minKwh?: number;
  maxKwh?: number;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  /** Woher stammt das Angebot? z. B. "Maklerpool XY, Abruf 10.10.2026" */
  source: string;
  officialUrl?: string;
  /** Vertragspartner, über den der Antrag läuft (Seite „Partner“) */
  partnerId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export class TariffError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}, readonly status = 400) {
    super(message);
  }
}

const COLLECTION = 'tariffs';
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN);

export function validateTariff(body: unknown, now: Date): Omit<Tariff, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const e: Record<string, string> = {};
  const energyType = b.energyType === 'gas' || b.energyType === 'strom' ? b.energyType : null;
  if (!energyType) e.energyType = 'Gas oder Strom wählen.';
  const providerName = str(b.providerName, 100);
  if (providerName.length < 2) e.providerName = 'Anbieter fehlt.';
  const tariffName = str(b.tariffName, 120);
  if (tariffName.length < 2) e.tariffName = 'Tarifname fehlt.';
  const work = num(b.workPriceCtPerKwh);
  if (!(work > 0 && work < 200)) e.workPriceCtPerKwh = 'Arbeitspreis in ct/kWh (brutto) zwischen 0 und 200.';
  const base = num(b.basePriceEurPerMonth);
  if (!(base >= 0 && base < 200)) e.basePriceEurPerMonth = 'Grundpreis in €/Monat (brutto) zwischen 0 und 200.';
  const guarantee = num(b.priceGuaranteeMonths ?? 0);
  if (!(Number.isInteger(guarantee) && guarantee >= 0 && guarantee <= 48)) e.priceGuaranteeMonths = '0–48 Monate.';
  const term = num(b.contractTermMonths);
  if (!(Number.isInteger(term) && term >= 0 && term <= 36)) e.contractTermMonths = '0–36 Monate.';
  const notice = num(b.noticePeriodWeeks);
  if (!(Number.isInteger(notice) && notice >= 0 && notice <= 26)) e.noticePeriodWeeks = '0–26 Wochen.';
  const bonus = b.bonusEur === undefined || b.bonusEur === '' || b.bonusEur === null ? undefined : num(b.bonusEur);
  if (bonus !== undefined && !(bonus >= 0 && bonus <= 1000)) e.bonusEur = 'Bonus 0–1.000 €.';
  const bonusConditions = str(b.bonusConditions, 300) || undefined;
  if (bonus && !bonusConditions) e.bonusConditions = 'Bitte die Bonusbedingungen angeben.';
  const postalCodes = (Array.isArray(b.postalCodes) ? b.postalCodes : String(b.postalCodes ?? '').split(/[\s,;]+/))
    .map((p) => String(p).trim())
    .filter(Boolean);
  if (postalCodes.some((p) => !/^\d{1,5}$/.test(p))) e.postalCodes = 'PLZ-Gebiete als Ziffern, z. B. „04, 06846“ (leer = bundesweit).';
  const minKwh = b.minKwh === undefined || b.minKwh === '' ? undefined : num(b.minKwh);
  const maxKwh = b.maxKwh === undefined || b.maxKwh === '' ? undefined : num(b.maxKwh);
  if (minKwh !== undefined && !(minKwh >= 0)) e.minKwh = 'Ungültig.';
  if (maxKwh !== undefined && !(maxKwh > 0)) e.maxKwh = 'Ungültig.';
  if (minKwh !== undefined && maxKwh !== undefined && minKwh > maxKwh) e.maxKwh = 'Muss größer als der Mindestverbrauch sein.';
  const today = now.toISOString().slice(0, 10);
  const validFrom = isDate(b.validFrom) ? b.validFrom : today;
  const validUntil = isDate(b.validUntil) ? b.validUntil : '';
  if (!validUntil) e.validUntil = 'Gültig-bis-Datum angeben (Angebote ändern sich).';
  else if (validUntil < validFrom) e.validUntil = 'Muss nach „Gültig ab“ liegen.';
  const source = str(b.source, 200);
  if (source.length < 3) e.source = 'Quelle angeben, z. B. „Maklerpool XY, Abruf 10.10.2026“.';
  const officialUrl = str(b.officialUrl, 500) || undefined;
  if (officialUrl && !/^https:\/\/[^\s]+$/.test(officialUrl)) e.officialUrl = 'Link muss mit https:// beginnen.';
  if (Object.keys(e).length) throw new TariffError('Bitte prüfen Sie den Tarif.', e);
  return {
    energyType: energyType!,
    providerName,
    tariffName,
    workPriceCtPerKwh: Math.round(work * 100) / 100,
    basePriceEurPerMonth: Math.round(base * 100) / 100,
    priceGuaranteeMonths: guarantee,
    priceGuaranteeType: str(b.priceGuaranteeType, 100) || undefined,
    contractTermMonths: term,
    noticePeriodWeeks: notice,
    eco: b.eco === true,
    bonusEur: bonus || undefined,
    bonusConditions: bonus ? bonusConditions : undefined,
    postalCodes,
    minKwh,
    maxKwh,
    validFrom,
    validUntil,
    source,
    officialUrl,
    partnerId: str(b.partnerId, 60) || undefined,
    active: b.active !== false,
  };
}

export class TariffCatalog {
  private tariffs = new Map<string, Tariff>();
  private constructor(private readonly backend?: Backend, private readonly now: () => Date = () => new Date()) {}

  static async open(backend?: Backend, now?: () => Date) {
    const c = new TariffCatalog(backend, now);
    for (const t of backend ? await backend.loadAll<Tariff>(COLLECTION) : []) c.tariffs.set(t.id, t);
    return c;
  }

  list() {
    return [...this.tariffs.values()].sort((a, b) => a.energyType.localeCompare(b.energyType) || a.providerName.localeCompare(b.providerName)).map((t) => structuredClone(t));
  }

  /** Aktive Tarife, die heute gültig sind */
  current(date = this.now()) {
    const today = date.toISOString().slice(0, 10);
    return this.list().filter((t) => t.active && t.validFrom <= today && t.validUntil >= today);
  }

  async create(body: unknown, actor: string) {
    const iso = this.now().toISOString();
    const t: Tariff = { ...validateTariff(body, this.now()), id: randomUUID(), createdAt: iso, updatedAt: iso, updatedBy: actor };
    await this.backend?.put(COLLECTION, t.id, t);
    this.tariffs.set(t.id, t);
    return structuredClone(t);
  }

  async update(id: string, body: unknown, actor: string) {
    const old = this.tariffs.get(id);
    if (!old) throw new TariffError('Tarif nicht gefunden.', {}, 404);
    const t: Tariff = { ...old, ...validateTariff(body, this.now()), updatedAt: this.now().toISOString(), updatedBy: actor };
    await this.backend?.put(COLLECTION, id, t);
    this.tariffs.set(id, t);
    return structuredClone(t);
  }

  async remove(id: string) {
    if (!this.tariffs.has(id)) throw new TariffError('Tarif nicht gefunden.', {}, 404);
    await this.backend?.remove(COLLECTION, id);
    this.tariffs.delete(id);
  }
}

export function matchesPostalCode(t: Tariff, postalCode: string) {
  return t.postalCodes.length === 0 || t.postalCodes.some((p) => postalCode.startsWith(p));
}

export function tariffToOffer(t: Tariff, input: ComparisonInput, fetchedAt: string): Offer {
  return {
    id: `kat-${t.id}`,
    providerName: t.providerName,
    tariffName: t.tariffName,
    energyType: t.energyType,
    workPriceCtPerKwh: t.workPriceCtPerKwh,
    basePriceEurPerMonth: t.basePriceEurPerMonth,
    bonuses: t.bonusEur ? [{ label: 'Bonus', amountEur: t.bonusEur, conditions: t.bonusConditions ?? '', oneTime: true }] : [],
    priceGuaranteeMonths: t.priceGuaranteeMonths,
    priceGuaranteeType: t.priceGuaranteeType,
    contractTermMonths: t.contractTermMonths,
    noticePeriodWeeks: t.noticePeriodWeeks,
    earliestStartDate: input.desiredStartDate,
    available: true,
    eco: t.eco,
    officialUrl: t.officialUrl,
    // "Stand" = letzte Pflege des Tarifs; Quelle wie im Katalog angegeben
    source: { providerId: 'daryos-katalog', name: t.source, isDemo: false, fetchedAt: t.updatedAt || fetchedAt },
  };
}

/**
 * Angebotsquelle: der Daryos-Tarifkatalog. Solange KEIN aktiver Tarif gepflegt ist, werden die
 * gekennzeichneten DEMO-Daten verwendet (niemals gemischt).
 */
export class CatalogOrFallbackProvider implements OfferProvider {
  constructor(private readonly catalog: TariffCatalog, private readonly fallback: OfferProvider) {}

  private useCatalog() {
    return this.catalog.current().length > 0;
  }

  get info(): OfferProviderInfo {
    return this.useCatalog()
      ? { id: 'daryos-katalog', name: 'Daryos-Tarifkatalog (von Daryos gepflegte Angebote)', isDemo: false, configured: true }
      : this.fallback.info;
  }

  async fetchOffers(input: ComparisonInput, signal: AbortSignal): Promise<OfferFetchResult> {
    if (!this.useCatalog()) return this.fallback.fetchOffers(input, signal);
    const fetchedAt = new Date().toISOString();
    const offers = this.catalog
      .current()
      .filter((t) => t.energyType === input.energyType && matchesPostalCode(t, input.postalCode))
      .filter((t) => (t.minKwh === undefined || input.annualConsumptionKwh >= t.minKwh) && (t.maxKwh === undefined || input.annualConsumptionKwh <= t.maxKwh))
      .map((t) => tariffToOffer(t, input, fetchedAt));
    return { offers, fetchedAt };
  }
}
