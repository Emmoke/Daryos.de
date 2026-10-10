// Buchhaltung für Daryos: Firmendaten, Rechnungen und Einnahmen/Ausgaben-Journal (Grundlage für die EÜR).
//
// Grundsätze (angelehnt an GoBD):
// - Beträge in Cent (Ganzzahlen), keine Rundungsfehler
// - Rechnungsnummern fortlaufend und lückenlos pro Jahr (RE-2026-0001 …)
// - Ausgestellte Rechnungen und Buchungen werden nie gelöscht oder verändert:
//   Korrektur nur über Stornorechnung bzw. Gegenbuchung
// - Kleinunternehmerregelung (§ 19 UStG) als Einstellung: dann ohne Umsatzsteuer mit Pflichthinweis
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  street: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  taxNumber: string;
  vatId: string;
  smallBusiness: boolean;
  iban: string;
  bic: string;
  bankName: string;
  invoicePrefix: string;
  paymentTermDays: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceCents: number; // netto (bzw. Endpreis bei Kleinunternehmer)
  vatRate: number; // 0, 7 oder 19
}

export type InvoiceStatus = 'offen' | 'bezahlt' | 'storniert';

export interface Invoice {
  id: string;
  number: string;
  kind: 'rechnung' | 'storno';
  issueDate: string; // YYYY-MM-DD
  serviceDate: string;
  dueDate: string;
  customer: { name: string; street: string; postalCode: string; city: string; email?: string };
  items: InvoiceItem[];
  smallBusiness: boolean;
  netCents: number;
  vatCents: number;
  grossCents: number;
  vatBreakdown: { rate: number; netCents: number; vatCents: number }[];
  status: InvoiceStatus;
  paidAt?: string;
  cancelsInvoiceId?: string;
  cancelledByInvoiceId?: string;
  notes?: string;
  linkedRequestId?: string;
  seller: BusinessSettings; // Firmendaten zum Ausstellungszeitpunkt (unveränderlich)
  createdAt: string;
  createdBy: string;
}

export type BookingType = 'einnahme' | 'ausgabe';

export const EXPENSE_CATEGORIES = ['Büro & Material', 'Telefon & Internet', 'Software & Lizenzen', 'Werbung', 'Fahrtkosten', 'Miete', 'Versicherungen', 'Fortbildung', 'Bankgebühren', 'Sonstiges'] as const;
export const INCOME_CATEGORIES = ['Provision', 'Beratungshonorar', 'Sonstige Einnahme'] as const;

export interface Booking {
  id: string;
  date: string;
  type: BookingType;
  category: string;
  description: string;
  grossCents: number; // positiv; Gegenbuchungen negativ
  vatRate: number;
  receiptNo?: string;
  invoiceId?: string;
  reversesBookingId?: string;
  reversedByBookingId?: string;
  createdAt: string;
  createdBy: string;
}

interface AccountingData {
  settings: BusinessSettings;
  invoices: Invoice[];
  bookings: Booking[];
  counters: Record<string, number>;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Daryos® – Tarifoptimierung & Wechselservice',
  ownerName: '',
  street: 'Rotfuchsstraße 1',
  postalCode: '04329',
  city: 'Leipzig',
  email: '',
  phone: '',
  taxNumber: '',
  vatId: '',
  smallBusiness: true,
  iban: '',
  bic: '',
  bankName: '',
  invoicePrefix: 'RE',
  paymentTermDays: 14,
};

export class AccountingError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}, readonly status = 400) {
    super(message);
  }
}

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);

export function computeTotals(items: InvoiceItem[], smallBusiness: boolean) {
  const byRate = new Map<number, number>();
  for (const it of items) {
    const line = Math.round(it.quantity * it.unitPriceCents);
    const rate = smallBusiness ? 0 : it.vatRate;
    byRate.set(rate, (byRate.get(rate) ?? 0) + line);
  }
  const vatBreakdown = [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, netCents]) => ({ rate, netCents, vatCents: Math.round((netCents * rate) / 100) }));
  const netCents = vatBreakdown.reduce((s, v) => s + v.netCents, 0);
  const vatCents = vatBreakdown.reduce((s, v) => s + v.vatCents, 0);
  return { netCents, vatCents, grossCents: netCents + vatCents, vatBreakdown };
}

export function settingsComplete(s: BusinessSettings): string[] {
  const missing: string[] = [];
  if (!s.businessName) missing.push('Firmenname');
  if (!s.ownerName) missing.push('Inhaber');
  if (!s.street || !s.postalCode || !s.city) missing.push('Anschrift');
  if (!s.taxNumber && !s.vatId) missing.push('Steuernummer oder USt-IdNr.');
  return missing;
}

export class AccountingStore {
  private data: AccountingData = { settings: { ...DEFAULT_SETTINGS }, invoices: [], bookings: [], counters: {} };
  private writing: Promise<void> = Promise.resolve();

  private constructor(private readonly file?: string, private readonly now: () => Date = () => new Date()) {}

  static async open(file?: string, now?: () => Date) {
    const store = new AccountingStore(file, now);
    if (file) {
      try {
        const loaded = JSON.parse(await fs.readFile(file, 'utf8')) as AccountingData;
        store.data = { ...store.data, ...loaded, settings: { ...DEFAULT_SETTINGS, ...loaded.settings } };
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    }
    return store;
  }

  getSettings() {
    return structuredClone(this.data.settings);
  }

  async updateSettings(body: unknown) {
    const b = (body ?? {}) as Record<string, unknown>;
    const s = this.data.settings;
    const next: BusinessSettings = {
      businessName: str(b.businessName ?? s.businessName, 120),
      ownerName: str(b.ownerName ?? s.ownerName, 120),
      street: str(b.street ?? s.street, 120),
      postalCode: str(b.postalCode ?? s.postalCode, 10),
      city: str(b.city ?? s.city, 80),
      email: str(b.email ?? s.email, 200),
      phone: str(b.phone ?? s.phone, 40),
      taxNumber: str(b.taxNumber ?? s.taxNumber, 40),
      vatId: str(b.vatId ?? s.vatId, 20),
      smallBusiness: typeof b.smallBusiness === 'boolean' ? b.smallBusiness : s.smallBusiness,
      iban: str(b.iban ?? s.iban, 40).replace(/\s+/g, ' '),
      bic: str(b.bic ?? s.bic, 15),
      bankName: str(b.bankName ?? s.bankName, 80),
      invoicePrefix: str(b.invoicePrefix ?? s.invoicePrefix, 6).toUpperCase() || 'RE',
      paymentTermDays: Number.isInteger(b.paymentTermDays) && (b.paymentTermDays as number) >= 0 && (b.paymentTermDays as number) <= 90 ? (b.paymentTermDays as number) : s.paymentTermDays,
    };
    const errors: Record<string, string> = {};
    if (next.postalCode && !/^\d{5}$/.test(next.postalCode)) errors.postalCode = 'Bitte eine fünfstellige PLZ angeben.';
    if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next.email)) errors.email = 'Ungültige E-Mail-Adresse.';
    if (!/^[A-Z]{1,6}$/.test(next.invoicePrefix)) errors.invoicePrefix = 'Nur Buchstaben A–Z.';
    if (Object.keys(errors).length) throw new AccountingError('Bitte prüfen Sie die Angaben.', errors);
    this.data.settings = next;
    await this.persist();
    return this.getSettings();
  }

  listInvoices() {
    return [...this.data.invoices].sort((a, b) => b.number.localeCompare(a.number)).map((i) => structuredClone(i));
  }

  getInvoice(id: string) {
    const i = this.data.invoices.find((x) => x.id === id);
    return i ? structuredClone(i) : undefined;
  }

  listBookings(year?: string) {
    return this.data.bookings
      .filter((b) => !year || b.date.startsWith(year))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .map((b) => structuredClone(b));
  }

  private nextNumber(year: string) {
    const n = (this.data.counters[year] ?? 0) + 1;
    this.data.counters[year] = n;
    return `${this.data.settings.invoicePrefix}-${year}-${String(n).padStart(4, '0')}`;
  }

  async createInvoice(body: unknown, actor: string) {
    const missingSettings = settingsComplete(this.data.settings);
    if (missingSettings.length) {
      throw new AccountingError(`Bitte zuerst die Firmendaten vervollständigen: ${missingSettings.join(', ')}.`, {}, 409);
    }
    const b = (body ?? {}) as Record<string, any>;
    const errors: Record<string, string> = {};
    const today = this.now().toISOString().slice(0, 10);
    const issueDate = isDate(b.issueDate) ? b.issueDate : today;
    const serviceDate = isDate(b.serviceDate) ? b.serviceDate : issueDate;
    const customer = {
      name: str(b.customer?.name, 120),
      street: str(b.customer?.street, 120),
      postalCode: str(b.customer?.postalCode, 10),
      city: str(b.customer?.city, 80),
      email: str(b.customer?.email, 200) || undefined,
    };
    if (customer.name.length < 2) errors['customer.name'] = 'Name des Kunden fehlt.';
    if (!customer.street || !customer.postalCode || !customer.city) errors['customer.address'] = 'Vollständige Anschrift des Kunden fehlt.';
    const smallBusiness = this.data.settings.smallBusiness;
    const rawItems = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
    const items: InvoiceItem[] = [];
    rawItems.forEach((it: any, i: number) => {
      const description = str(it?.description, 300);
      const quantity = Number(it?.quantity);
      const unitPriceCents = Math.round(Number(it?.unitPriceCents));
      const vatRate = smallBusiness ? 0 : Number(it?.vatRate);
      if (!description) errors[`items.${i}.description`] = 'Beschreibung fehlt.';
      if (!(quantity > 0 && quantity <= 100000)) errors[`items.${i}.quantity`] = 'Menge ungültig.';
      if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0 || unitPriceCents > 100_000_000) errors[`items.${i}.unitPrice`] = 'Preis ungültig.';
      if (![0, 7, 19].includes(vatRate)) errors[`items.${i}.vatRate`] = 'USt-Satz 0, 7 oder 19 %.';
      items.push({ description, quantity, unitPriceCents, vatRate });
    });
    if (!items.length) errors.items = 'Mindestens eine Position angeben.';
    if (Object.keys(errors).length) throw new AccountingError('Bitte prüfen Sie die Rechnung.', errors);

    const year = issueDate.slice(0, 4);
    const invoice: Invoice = {
      id: randomUUID(),
      number: this.nextNumber(year),
      kind: 'rechnung',
      issueDate,
      serviceDate,
      dueDate: addDays(issueDate, this.data.settings.paymentTermDays),
      customer,
      items,
      smallBusiness,
      ...computeTotals(items, smallBusiness),
      status: 'offen',
      notes: str(b.notes, 1000) || undefined,
      linkedRequestId: str(b.linkedRequestId, 20) || undefined,
      seller: this.getSettings(),
      createdAt: this.now().toISOString(),
      createdBy: actor,
    };
    this.data.invoices.push(invoice);
    await this.persist();
    return structuredClone(invoice);
  }

  async markPaid(id: string, paidAt: unknown, actor: string) {
    const inv = this.data.invoices.find((x) => x.id === id);
    if (!inv) throw new AccountingError('Rechnung nicht gefunden.', {}, 404);
    if (inv.kind !== 'rechnung' || inv.status !== 'offen') throw new AccountingError('Nur offene Rechnungen können als bezahlt markiert werden.', {}, 409);
    const date = isDate(paidAt) ? paidAt : this.now().toISOString().slice(0, 10);
    inv.status = 'bezahlt';
    inv.paidAt = date;
    this.data.bookings.push({
      id: randomUUID(),
      date,
      type: 'einnahme',
      category: 'Beratungshonorar',
      description: `Zahlungseingang ${inv.number} – ${inv.customer.name}`,
      grossCents: inv.grossCents,
      vatRate: inv.vatBreakdown.length === 1 ? inv.vatBreakdown[0].rate : 0,
      invoiceId: inv.id,
      createdAt: this.now().toISOString(),
      createdBy: actor,
    });
    await this.persist();
    return structuredClone(inv);
  }

  /** Storniert eine Rechnung über eine Stornorechnung mit negativen Beträgen (die Originalrechnung bleibt erhalten). */
  async cancelInvoice(id: string, reason: unknown, actor: string) {
    const inv = this.data.invoices.find((x) => x.id === id);
    if (!inv) throw new AccountingError('Rechnung nicht gefunden.', {}, 404);
    if (inv.kind !== 'rechnung' || inv.status === 'storniert') throw new AccountingError('Diese Rechnung kann nicht storniert werden.', {}, 409);
    const why = str(reason, 300);
    if (!why) throw new AccountingError('Bitte einen Stornogrund angeben.', { reason: 'Pflichtfeld' });
    const today = this.now().toISOString().slice(0, 10);
    const negItems = inv.items.map((it) => ({ ...it, quantity: -it.quantity }));
    const storno: Invoice = {
      ...structuredClone(inv),
      id: randomUUID(),
      number: this.nextNumber(today.slice(0, 4)),
      kind: 'storno',
      issueDate: today,
      dueDate: today,
      items: negItems,
      ...computeTotals(negItems, inv.smallBusiness),
      status: 'storniert',
      paidAt: undefined,
      cancelsInvoiceId: inv.id,
      notes: `Stornorechnung zu ${inv.number}. Grund: ${why}`,
      seller: this.getSettings(),
      createdAt: this.now().toISOString(),
      createdBy: actor,
    };
    if (inv.status === 'bezahlt') {
      this.data.bookings.push({
        id: randomUUID(),
        date: today,
        type: 'einnahme',
        category: 'Beratungshonorar',
        description: `Storno ${inv.number} (${storno.number}) – Rückerstattung`,
        grossCents: -inv.grossCents,
        vatRate: inv.vatBreakdown.length === 1 ? inv.vatBreakdown[0].rate : 0,
        invoiceId: storno.id,
        createdAt: this.now().toISOString(),
        createdBy: actor,
      });
    }
    inv.status = 'storniert';
    inv.cancelledByInvoiceId = storno.id;
    this.data.invoices.push(storno);
    await this.persist();
    return { invoice: structuredClone(inv), storno: structuredClone(storno) };
  }

  async addBooking(body: unknown, actor: string) {
    const b = (body ?? {}) as Record<string, unknown>;
    const errors: Record<string, string> = {};
    const type = b.type === 'einnahme' || b.type === 'ausgabe' ? b.type : null;
    if (!type) errors.type = 'Einnahme oder Ausgabe wählen.';
    const date = isDate(b.date) ? b.date : '';
    if (!date) errors.date = 'Datum fehlt.';
    else if (date > this.now().toISOString().slice(0, 10)) errors.date = 'Buchungen dürfen nicht in der Zukunft liegen.';
    const allowed: readonly string[] = type === 'einnahme' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = str(b.category, 60);
    if (type && !allowed.includes(category)) errors.category = 'Bitte eine Kategorie wählen.';
    const description = str(b.description, 300);
    if (!description) errors.description = 'Beschreibung fehlt.';
    const grossCents = Math.round(Number(b.grossCents));
    if (!(grossCents > 0 && grossCents <= 100_000_000)) errors.grossCents = 'Betrag muss größer als 0 sein.';
    const vatRate = Number(b.vatRate ?? 0);
    if (![0, 7, 19].includes(vatRate)) errors.vatRate = 'USt-Satz 0, 7 oder 19 %.';
    if (Object.keys(errors).length) throw new AccountingError('Bitte prüfen Sie die Buchung.', errors);
    const booking: Booking = {
      id: randomUUID(),
      date,
      type: type!,
      category,
      description,
      grossCents,
      vatRate,
      receiptNo: str(b.receiptNo, 40) || undefined,
      createdAt: this.now().toISOString(),
      createdBy: actor,
    };
    this.data.bookings.push(booking);
    await this.persist();
    return structuredClone(booking);
  }

  /** Gegenbuchung statt Löschen (nachvollziehbar). */
  async reverseBooking(id: string, actor: string) {
    const orig = this.data.bookings.find((x) => x.id === id);
    if (!orig) throw new AccountingError('Buchung nicht gefunden.', {}, 404);
    if (orig.reversedByBookingId || orig.reversesBookingId) throw new AccountingError('Diese Buchung wurde bereits storniert bzw. ist selbst eine Gegenbuchung.', {}, 409);
    if (orig.invoiceId) throw new AccountingError('Zahlungseingänge zu Rechnungen werden über die Stornierung der Rechnung korrigiert.', {}, 409);
    const rev: Booking = {
      ...structuredClone(orig),
      id: randomUUID(),
      date: this.now().toISOString().slice(0, 10),
      description: `Gegenbuchung: ${orig.description}`,
      grossCents: -orig.grossCents,
      reversesBookingId: orig.id,
      createdAt: this.now().toISOString(),
      createdBy: actor,
    };
    orig.reversedByBookingId = rev.id;
    this.data.bookings.push(rev);
    await this.persist();
    return structuredClone(rev);
  }

  summary(year: string) {
    const bookings = this.data.bookings.filter((b) => b.date.startsWith(year));
    const net = (b: Booking) => Math.round((b.grossCents * 100) / (100 + b.vatRate));
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, incomeCents: 0, expenseCents: 0 }));
    let incomeCents = 0;
    let expenseCents = 0;
    let vatCollectedCents = 0;
    let vatPaidCents = 0;
    const byCategory = new Map<string, number>();
    for (const b of bookings) {
      const m = months[Number(b.date.slice(5, 7)) - 1];
      if (b.type === 'einnahme') {
        incomeCents += b.grossCents;
        m.incomeCents += b.grossCents;
        vatCollectedCents += b.grossCents - net(b);
      } else {
        expenseCents += b.grossCents;
        m.expenseCents += b.grossCents;
        vatPaidCents += b.grossCents - net(b);
        byCategory.set(b.category, (byCategory.get(b.category) ?? 0) + b.grossCents);
      }
    }
    const open = this.data.invoices.filter((i) => i.kind === 'rechnung' && i.status === 'offen');
    const today = this.now().toISOString().slice(0, 10);
    return {
      year,
      smallBusiness: this.data.settings.smallBusiness,
      incomeCents,
      expenseCents,
      resultCents: incomeCents - expenseCents,
      vatCollectedCents,
      vatPaidCents,
      openInvoices: { count: open.length, totalCents: open.reduce((s, i) => s + i.grossCents, 0), overdue: open.filter((i) => i.dueDate < today).length },
      months,
      expensesByCategory: [...byCategory.entries()].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents),
    };
  }

  bookingsCsv(year: string) {
    const fmt = (c: number) => (c / 100).toFixed(2).replace('.', ',');
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = this.listBookings(year)
      .reverse()
      .map((b) => [b.date, b.type === 'einnahme' ? 'Einnahme' : 'Ausgabe', esc(b.category), esc(b.description), fmt(b.grossCents), `${b.vatRate}`, fmt(b.grossCents - Math.round((b.grossCents * 100) / (100 + b.vatRate))), esc(b.receiptNo ?? ''), esc(b.invoiceId ? (this.data.invoices.find((i) => i.id === b.invoiceId)?.number ?? '') : '')].join(';'));
    return '﻿' + ['Datum;Art;Kategorie;Beschreibung;Brutto EUR;USt %;USt EUR;Beleg-Nr.;Rechnung', ...rows].join('\r\n') + '\r\n';
  }

  private persist() {
    if (!this.file) return Promise.resolve();
    const file = this.file;
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writing = this.writing.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, file);
    });
    return this.writing;
  }
}
