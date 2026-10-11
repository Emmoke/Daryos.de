// Terminvereinbarung: Kunden fragen einen Wunschtermin an, Daryos bestätigt (oder schlägt einen anderen Termin vor).
// Erst die Bestätigung durch Daryos macht den Termin verbindlich.
import { randomBytes, randomUUID } from 'node:crypto';
import type { Backend } from './persistence';

export const APPOINTMENT_FORMATS = { 'vor-ort': 'Vor Ort im Büro', telefon: 'Telefon', video: 'Video', whatsapp: 'WhatsApp' } as const;
export const APPOINTMENT_SERVICES = { strom: 'Strom', gas: 'Gas', internet: 'Internet & Festnetz', all: 'Rundum-Tarifcheck' } as const;
export const APPOINTMENT_STATUS = { angefragt: 'Angefragt', bestaetigt: 'Bestätigt', abgesagt: 'Abgesagt', erledigt: 'Erledigt' } as const;
export type AppointmentFormat = keyof typeof APPOINTMENT_FORMATS;
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

export interface Appointment {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: AppointmentStatus;
  source: 'webseite' | 'verwaltung';
  name: string;
  phone: string;
  email?: string;
  service: keyof typeof APPOINTMENT_SERVICES;
  format: AppointmentFormat;
  wish?: { date: string; time: string };
  confirmed?: { date: string; time: string; durationMin: number; location: string; note?: string };
  notes?: string;
  requestId?: string;
  /** Unerratbarer Schlüssel für den Kalender-Download des Kunden */
  calendarToken: string;
  history: { at: string; actor: string; text: string }[];
  consentAt?: string;
  deleteAfter: string;
}

export class AppointmentError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}, readonly status = 400) {
    super(message);
  }
}

export const OFFICE = 'Rotfuchsstraße 1, 04329 Leipzig';
const COLLECTION = 'appointments';
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const day = (d: Date) => d.toISOString().slice(0, 10);

export function defaultLocation(format: AppointmentFormat, phone: string) {
  return format === 'vor-ort' ? OFFICE : format === 'telefon' ? `Daryos ruft an: ${phone}` : format === 'video' ? 'Video – Link folgt per E-Mail' : `WhatsApp: ${phone}`;
}

/** Eingaben vom Webseiten-Formular bzw. aus der Verwaltung prüfen */
export function validateAppointmentInput(body: unknown, now: Date, opts: { requireConsent: boolean }) {
  const b = (body ?? {}) as Record<string, unknown>;
  const e: Record<string, string> = {};
  if (str(b.website, 100)) e.website = 'Ungültig.';
  const name = str(b.name, 100);
  if (name.length < 2) e.name = 'Bitte Ihren Namen angeben.';
  const phone = str(b.phone, 30);
  if (!/^\+?[\d ()/-]{6,30}$/.test(phone)) e.phone = 'Bitte eine gültige Telefonnummer angeben.';
  const email = str(b.email, 200).toLowerCase() || undefined;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-Mail-Adresse ungültig.';
  const service = (Object.keys(APPOINTMENT_SERVICES) as (keyof typeof APPOINTMENT_SERVICES)[]).find((k) => k === b.service) ?? 'all';
  const format = (Object.keys(APPOINTMENT_FORMATS) as AppointmentFormat[]).find((k) => k === b.format);
  if (!format) e.format = 'Bitte eine Beratungsart wählen.';
  const date = str(b.date, 10);
  const time = str(b.time, 5);
  const max = day(new Date(now.getTime() + 120 * 86_400_000));
  if (!isDate(date)) e.date = 'Bitte ein Datum wählen.';
  else if (date < day(now)) e.date = 'Das Datum liegt in der Vergangenheit.';
  else if (date > max) e.date = 'Bitte einen Termin innerhalb der nächsten 4 Monate wählen.';
  else if (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) e.date = 'Sonntags finden keine Termine statt.';
  if (!isTime(time)) e.time = 'Bitte eine Uhrzeit wählen.';
  const notes = str(b.notes, 500) || undefined;
  if (opts.requireConsent && b.consentPrivacy !== true) e.consentPrivacy = 'Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.';
  if (Object.keys(e).length) throw new AppointmentError('Bitte prüfen Sie Ihre Angaben.', e);
  return { name, phone, email, service, format: format!, date, time, notes };
}

export function validateConfirmation(body: unknown, now: Date, a: Appointment) {
  const b = (body ?? {}) as Record<string, unknown>;
  const e: Record<string, string> = {};
  const date = str(b.date, 10) || a.wish?.date || '';
  const time = str(b.time, 5) || a.wish?.time || '';
  if (!isDate(date)) e.date = 'Datum fehlt.';
  else if (date < day(now)) e.date = 'Das Datum liegt in der Vergangenheit.';
  if (!isTime(time)) e.time = 'Uhrzeit fehlt.';
  const durationMin = Number(b.durationMin ?? 45);
  if (!(Number.isInteger(durationMin) && durationMin >= 15 && durationMin <= 240)) e.durationMin = '15–240 Minuten.';
  const location = str(b.location, 200) || defaultLocation(a.format, a.phone);
  if (Object.keys(e).length) throw new AppointmentError('Bitte prüfen Sie den Termin.', e);
  return { date, time, durationMin, location, note: str(b.note, 500) || undefined };
}

const shortId = () => {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return 'TR-' + [...randomBytes(6)].map((x) => A[x % A.length]).join('');
};

export class AppointmentStore {
  private items = new Map<string, Appointment>();
  private constructor(private readonly backend?: Backend, private readonly now: () => Date = () => new Date()) {}

  static async open(backend?: Backend, now?: () => Date) {
    const s = new AppointmentStore(backend, now);
    if (backend) for (const a of await backend.loadAll<Appointment>(COLLECTION)) s.items.set(a.id, a);
    return s;
  }

  list() {
    return [...this.items.values()].map((a) => structuredClone(a)).sort((a, b) => (a.confirmed?.date ?? a.wish?.date ?? '').localeCompare(b.confirmed?.date ?? b.wish?.date ?? ''));
  }
  get(id: string) {
    const a = this.items.get(id);
    return a ? structuredClone(a) : undefined;
  }
  byToken(token: string) {
    for (const a of this.items.values()) if (token.length >= 20 && a.calendarToken === token) return structuredClone(a);
    return undefined;
  }
  byEmail(email: string) {
    return this.list().filter((a) => a.email === email);
  }

  async create(input: ReturnType<typeof validateAppointmentInput>, source: Appointment['source'], actor: string, extra: { requestId?: string; consent?: boolean } = {}) {
    const iso = this.now().toISOString();
    const a: Appointment = {
      id: shortId(),
      createdAt: iso,
      updatedAt: iso,
      status: 'angefragt',
      source,
      name: input.name,
      phone: input.phone,
      email: input.email,
      service: input.service,
      format: input.format,
      wish: { date: input.date, time: input.time },
      notes: input.notes,
      requestId: extra.requestId,
      calendarToken: randomBytes(24).toString('base64url'),
      history: [{ at: iso, actor, text: `Termin angefragt für ${input.date} ${input.time} (${APPOINTMENT_FORMATS[input.format]})` }],
      consentAt: extra.consent ? iso : undefined,
      deleteAfter: new Date(Date.parse(`${input.date}T00:00:00Z`) + 90 * 86_400_000).toISOString(),
    };
    await this.backend?.put(COLLECTION, a.id, a);
    this.items.set(a.id, a);
    return structuredClone(a);
  }

  async update(id: string, actor: string, text: string, mutate: (a: Appointment) => void) {
    const cur = this.items.get(id);
    if (!cur) throw new AppointmentError('Termin nicht gefunden.', {}, 404);
    const next = structuredClone(cur);
    mutate(next);
    next.updatedAt = this.now().toISOString();
    next.history.push({ at: next.updatedAt, actor, text });
    const ref = next.confirmed?.date ?? next.wish?.date ?? day(this.now());
    next.deleteAfter = new Date(Date.parse(`${ref}T00:00:00Z`) + 90 * 86_400_000).toISOString();
    await this.backend?.put(COLLECTION, id, next);
    this.items.set(id, next);
    return structuredClone(next);
  }

  async purgeExpired(now: Date) {
    const iso = now.toISOString();
    for (const [id, a] of [...this.items]) {
      if (a.deleteAfter < iso) {
        await this.backend?.remove(COLLECTION, id);
        this.items.delete(id);
      }
    }
  }
}

const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });
export const describeTime = (date: string, time: string) => `${fmtDate(date)} um ${time} Uhr`;

/** Kalenderdatei (ICS) für einen bestätigten Termin, Zeitzone Europa/Berlin */
export function appointmentIcs(a: Appointment, stampIso: string) {
  const c = a.confirmed!;
  const [h, m] = c.time.split(':').map(Number);
  const start = `${c.date.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const endMin = h * 60 + m + c.durationMin;
  const end = `${c.date.replace(/-/g, '')}T${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}${String(endMin % 60).padStart(2, '0')}00`;
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (x) => `\\${x}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daryos//Termine//DE', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${a.id}@daryos.de`,
    `DTSTAMP:${stampIso.replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Berlin:${start}`,
    `DTEND;TZID=Europe/Berlin:${end}`,
    `SUMMARY:${esc(`Daryos Beratung (${APPOINTMENT_SERVICES[a.service]}, ${APPOINTMENT_FORMATS[a.format]})`)}`,
    `LOCATION:${esc(c.location)}`,
    `DESCRIPTION:${esc(`Termin ${a.id}${c.note ? `\n${c.note}` : ''}\nBei Verhinderung bitte absagen: +49 176 43416174`)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
