// Antragsdaten für den Anbieterwechsel: von Daryos oder vom Kunden („Mein Konto“) ausgefüllt, automatisch geprüft,
// anschließend von Daryos im Partnerportal eingereicht. Bankdaten werden bewusst NICHT gespeichert –
// die gibt der Kunde direkt beim Anbieter bzw. im Portal an.
import type { RequestRecord } from './store';

export interface ApplicationField {
  key: string;
  label: string;
  group: 'Person' | 'Lieferadresse' | 'Zähler' | 'Bisheriger Vertrag' | 'Neuer Tarif';
  required?: boolean;
  /** Darf der Kunde dieses Feld in „Mein Konto“ selbst ausfüllen? */
  customer?: boolean;
  type?: 'text' | 'date' | 'select';
  options?: Record<string, string>;
  placeholder?: string;
}

export const APPLICATION_FIELDS: ApplicationField[] = [
  { key: 'anrede', label: 'Anrede', group: 'Person', type: 'select', options: { frau: 'Frau', herr: 'Herr', divers: 'Divers / keine Angabe' }, customer: true },
  { key: 'vorname', label: 'Vorname', group: 'Person', required: true, customer: true },
  { key: 'nachname', label: 'Nachname', group: 'Person', required: true, customer: true },
  { key: 'geburtsdatum', label: 'Geburtsdatum', group: 'Person', type: 'date', required: true, customer: true },
  { key: 'email', label: 'E-Mail', group: 'Person', required: true, customer: true },
  { key: 'telefon', label: 'Telefon', group: 'Person', customer: true },
  { key: 'strasse', label: 'Straße', group: 'Lieferadresse', required: true, customer: true },
  { key: 'hausnummer', label: 'Hausnummer', group: 'Lieferadresse', required: true, customer: true },
  { key: 'plz', label: 'PLZ', group: 'Lieferadresse', required: true, customer: true },
  { key: 'ort', label: 'Ort', group: 'Lieferadresse', required: true, customer: true },
  { key: 'zaehlernummer', label: 'Zählernummer', group: 'Zähler', required: true, customer: true, placeholder: 'steht auf dem Zähler und der Rechnung' },
  { key: 'marktlokation', label: 'Marktlokations-ID (MaLo)', group: 'Zähler', customer: true, placeholder: '11 Ziffern, auf der Rechnung' },
  { key: 'zaehlerstand', label: 'Zählerstand (bei Umzug)', group: 'Zähler', customer: true },
  { key: 'zaehlerstand_datum', label: 'Ablesedatum', group: 'Zähler', type: 'date', customer: true },
  { key: 'wechselgrund', label: 'Anlass', group: 'Bisheriger Vertrag', type: 'select', required: true, options: { wechsel: 'Anbieterwechsel', umzug: 'Umzug / Neueinzug' }, customer: true },
  { key: 'bisheriger_anbieter', label: 'Bisheriger Anbieter', group: 'Bisheriger Vertrag', customer: true },
  { key: 'kundennummer_alt', label: 'Kundennummer beim bisherigen Anbieter', group: 'Bisheriger Vertrag', customer: true },
  { key: 'kuendigung', label: 'Kündigung', group: 'Bisheriger Vertrag', type: 'select', options: { neuer_anbieter: 'Neuer Anbieter kündigt', bereits_gekuendigt: 'Bereits selbst gekündigt' }, customer: true },
  { key: 'lieferbeginn', label: 'Gewünschter Lieferbeginn', group: 'Bisheriger Vertrag', type: 'date', customer: true, placeholder: 'leer = nächstmöglich' },
  { key: 'anbieter', label: 'Neuer Anbieter', group: 'Neuer Tarif', required: true },
  { key: 'tarif', label: 'Tarif', group: 'Neuer Tarif', required: true },
  { key: 'jahresverbrauch', label: 'Jahresverbrauch (kWh)', group: 'Neuer Tarif', required: true, customer: true },
  { key: 'arbeitspreis', label: 'Arbeitspreis (ct/kWh)', group: 'Neuer Tarif' },
  { key: 'grundpreis', label: 'Grundpreis (€/Monat)', group: 'Neuer Tarif' },
];
const FIELD_KEYS = new Set(APPLICATION_FIELDS.map((f) => f.key));
export const CUSTOMER_FIELD_KEYS = new Set(APPLICATION_FIELDS.filter((f) => f.customer).map((f) => f.key));

export type ApplicationStatus = 'entwurf' | 'daten_angefordert' | 'vollstaendig' | 'eingereicht';
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  entwurf: 'Entwurf',
  daten_angefordert: 'Kunde ergänzt Daten',
  vollstaendig: 'Vollständig – bereit zum Einreichen',
  eingereicht: 'Im Partnerportal eingereicht',
};

export interface ApplicationCheck {
  field?: string;
  level: 'fehler' | 'warnung';
  message: string;
}

export interface Application {
  partnerId?: string;
  fields: Record<string, string>;
  status: ApplicationStatus;
  checks: ApplicationCheck[];
  updatedAt: string;
  updatedBy: string;
  submittedAt?: string;
  portalRef?: string;
}

/** Prüfziffer der Marktlokations-ID (11 Ziffern, Verfahren nach BDEW) */
export function validMaLo(id: string) {
  if (!/^[1-9]\d{10}$/.test(id)) return false;
  const d = id.split('').map(Number);
  let odd = 0;
  let even = 0;
  for (let i = 0; i < 10; i++) (i % 2 === 0 ? (odd += d[i]) : (even += d[i]));
  const check = (10 - ((odd + even * 2) % 10)) % 10;
  return check === d[10];
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export function cleanFields(input: unknown, allowed: Set<string> = FIELD_KEYS) {
  const out: Record<string, string> = {};
  const b = (input ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(b)) {
    if (!allowed.has(k) || typeof b[k] !== 'string') continue;
    const v = (b[k] as string).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);
    if (v) out[k] = v;
  }
  return out;
}

export function checkApplication(fields: Record<string, string>, record: RequestRecord | undefined, now: Date): ApplicationCheck[] {
  const c: ApplicationCheck[] = [];
  const today = now.toISOString().slice(0, 10);
  for (const f of APPLICATION_FIELDS) if (f.required && !fields[f.key]) c.push({ field: f.key, level: 'fehler', message: `${f.label} fehlt.` });
  const f = fields;
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) c.push({ field: 'email', level: 'fehler', message: 'E-Mail-Adresse ungültig.' });
  if (f.plz && !/^\d{5}$/.test(f.plz)) c.push({ field: 'plz', level: 'fehler', message: 'PLZ muss 5 Ziffern haben.' });
  if (f.geburtsdatum) {
    if (!isDate(f.geburtsdatum)) c.push({ field: 'geburtsdatum', level: 'fehler', message: 'Geburtsdatum ungültig.' });
    else {
      const adult = new Date(f.geburtsdatum);
      adult.setFullYear(adult.getFullYear() + 18);
      if (adult > now) c.push({ field: 'geburtsdatum', level: 'fehler', message: 'Vertragspartner muss volljährig sein.' });
    }
  }
  if (f.zaehlernummer && !/^[A-Za-z0-9 .-]{5,30}$/.test(f.zaehlernummer)) c.push({ field: 'zaehlernummer', level: 'warnung', message: 'Zählernummer ungewöhnlich – bitte mit Rechnung vergleichen.' });
  if (f.marktlokation && !validMaLo(f.marktlokation.replace(/\s/g, ''))) c.push({ field: 'marktlokation', level: 'fehler', message: 'Marktlokations-ID ungültig (11 Ziffern mit Prüfziffer).' });
  if (f.lieferbeginn) {
    if (!isDate(f.lieferbeginn)) c.push({ field: 'lieferbeginn', level: 'fehler', message: 'Lieferbeginn ungültig.' });
    else if (f.lieferbeginn < today) c.push({ field: 'lieferbeginn', level: 'fehler', message: 'Lieferbeginn liegt in der Vergangenheit.' });
  }
  if (f.wechselgrund === 'umzug' && !f.zaehlerstand) c.push({ field: 'zaehlerstand', level: 'warnung', message: 'Bei Umzug wird meist ein Zählerstand benötigt.' });
  if (f.wechselgrund === 'wechsel' && !f.bisheriger_anbieter) c.push({ field: 'bisheriger_anbieter', level: 'warnung', message: 'Bisheriger Anbieter fehlt (für die Kündigung nötig).' });
  if (f.jahresverbrauch && !(Number(f.jahresverbrauch.replace(/\./g, '').replace(',', '.')) > 0)) c.push({ field: 'jahresverbrauch', level: 'fehler', message: 'Jahresverbrauch als Zahl angeben.' });
  if (record?.input.postalCode && f.plz && record.input.postalCode !== f.plz) c.push({ field: 'plz', level: 'warnung', message: `PLZ weicht vom Vergleich ab (${record.input.postalCode}) – Tarif für diese PLZ prüfen.` });
  const sel = record?.comparison?.offers.find((o) => o.offer.id === record.selectedOfferId)?.offer;
  if (sel?.source.isDemo) c.push({ level: 'fehler', message: 'Das gewählte Angebot ist ein DEMO-Beispiel – erst ein echtes Angebot wählen.' });
  return c;
}

/** Vorbelegung aus der Anfrage (Kontaktdaten, Vergleich, gewähltes Angebot) */
export function prefillFromRequest(r: RequestRecord): Record<string, string> {
  const out: Record<string, string> = {};
  const name = r.contact?.name?.trim() ?? '';
  if (name) {
    const parts = name.split(/\s+/);
    out.nachname = parts.length > 1 ? parts.pop()! : name;
    if (parts.length) out.vorname = parts.join(' ');
  }
  if (r.contact?.email) out.email = r.contact.email;
  if ((r.contact as { phone?: string } | undefined)?.phone) out.telefon = (r.contact as { phone?: string }).phone!;
  if (r.input.postalCode) out.plz = r.input.postalCode;
  if (r.input.annualConsumptionKwh) out.jahresverbrauch = String(r.input.annualConsumptionKwh);
  const sel = r.comparison?.offers.find((o) => o.offer.id === r.selectedOfferId)?.offer;
  if (sel && !sel.source.isDemo) {
    out.anbieter = sel.providerName;
    out.tarif = sel.tariffName;
    out.arbeitspreis = String(sel.workPriceCtPerKwh).replace('.', ',');
    out.grundpreis = String(sel.basePriceEurPerMonth).replace('.', ',');
  }
  return out;
}

/** Status nach dem Speichern: vollständig, wenn keine Fehler mehr offen sind */
export function nextStatus(current: ApplicationStatus | undefined, checks: ApplicationCheck[]): ApplicationStatus {
  if (current === 'eingereicht') return 'eingereicht';
  if (!checks.some((c) => c.level === 'fehler')) return 'vollstaendig';
  return current === 'daten_angefordert' ? 'daten_angefordert' : 'entwurf';
}

/** Was die KI aus einer Rechnung auslesen soll (Schlüssel = Feldnamen oben) */
export const EXTRACT_KEYS = ['vorname', 'nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'zaehlernummer', 'marktlokation', 'bisheriger_anbieter', 'kundennummer_alt', 'jahresverbrauch', 'zaehlerstand', 'zaehlerstand_datum'] as const;

export const EXTRACT_PROMPT = `Lies aus dieser Strom- oder Gasrechnung (bzw. dem Foto vom Zähler) folgende Angaben aus und antworte NUR mit einem JSON-Objekt:
{"vorname":"","nachname":"","strasse":"","hausnummer":"","plz":"","ort":"","zaehlernummer":"","marktlokation":"","bisheriger_anbieter":"","kundennummer_alt":"","jahresverbrauch":"","zaehlerstand":"","zaehlerstand_datum":""}
Regeln: Nur Werte eintragen, die eindeutig im Dokument stehen – sonst leerer String. Nichts raten oder erfinden.
Lieferadresse (Verbrauchsstelle) verwenden, nicht die Adresse des Anbieters. jahresverbrauch als ganze Zahl in kWh ohne Einheit.
Datumsangaben als JJJJ-MM-TT. marktlokation = 11-stellige Marktlokations-ID (nicht die Messlokation mit „DE…“).`;

export function parseExtraction(text: string): Record<string, string> {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    const raw = JSON.parse(m[0]) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const k of EXTRACT_KEYS) {
      const v = raw[k];
      if (typeof v === 'string' || typeof v === 'number') {
        const s = String(v).trim().slice(0, 100);
        if (s) out[k] = s;
      }
    }
    return out;
  } catch {
    return {};
  }
}
