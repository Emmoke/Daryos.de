// KI-Vertragsassistent. Die Vollständigkeitsprüfung und Zusammenfassung funktionieren regelbasiert ohne KI;
// Gemini wird (falls konfiguriert) nur serverseitig und ausschließlich auf Basis der gespeicherten Angebotsdaten genutzt.
import { GoogleGenAI } from '@google/genai';
import { STATUS_LABELS } from '../shared/platform';
import type { RankedOffer } from '../shared/platform';
import type { AdminSummary, DraftDocument, RequestRecord } from './store';
import { randomUUID } from 'node:crypto';

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

const SYSTEM_RULES = `Du bist der Vertragsassistent von Daryos, einem Vermittler für Energieverträge.
Regeln (verbindlich):
- Nutze ausschließlich die im Kontext gelieferten Angebotsdaten. Erfinde niemals Preise, Tarife, Anbieter oder Vertragsbedingungen.
- Fehlt eine Information im Kontext, sage das ausdrücklich und empfehle die Rückfrage bei Daryos.
- Gib keine verbindlichen Zusagen. Ein Vertrag kommt erst nach Prüfung durch Daryos und Bestätigung des Anbieters zustande.
- Ist ein Angebot als DEMO gekennzeichnet, weise darauf hin, dass es sich um Testdaten handelt, die nicht buchbar sind.
- Boni sind einmalig und keine dauerhafte Ersparnis.
- Antworte auf Deutsch, sachlich und verständlich, höchstens 150 Wörter.
- Bei Unsicherheit, Beschwerden, rechtlichen Fragen oder Wunsch nach einem Menschen: empfehle die persönliche Beratung durch Daryos.`;

export function selectedOffer(record: RequestRecord): RankedOffer | undefined {
  return record.comparison?.offers.find((o) => o.offer.id === record.selectedOfferId);
}

function offerContext(record: RequestRecord): string {
  const c = record.comparison;
  if (!c) return 'Keine Angebotsdaten vorhanden.';
  const lines = c.offers.map((r, i) => {
    const o = r.offer;
    return [
      `${i + 1}. ${o.providerName} – ${o.tariffName}${o.source.isDemo ? ' [DEMO – nicht buchbar]' : ''}`,
      `   Arbeitspreis: ${o.workPriceCtPerKwh ?? 'unbekannt'} ct/kWh, Grundpreis: ${o.basePriceEurPerMonth ?? 'unbekannt'} €/Monat`,
      `   Laufzeit: ${o.contractTermMonths ?? 'unbekannt'} Monate, Kündigungsfrist: ${o.noticePeriodWeeks ?? 'unbekannt'} Wochen, Preisgarantie: ${o.priceGuaranteeMonths ?? 'unbekannt'} Monate`,
      r.cost ? `   Geschätzte Jahreskosten ohne Bonus: ${eur(r.cost.annualCostWithoutBonusEur)}, im 1. Jahr mit Bonus: ${eur(r.cost.firstYearCostWithBonusEur)}` : `   Unvollständig, fehlend: ${r.missingFields.join(', ')}`,
      o.bonuses.length ? `   Boni: ${o.bonuses.map((b) => `${b.label} ${eur(b.amountEur)} (${b.conditions})`).join('; ')}` : '',
    ].filter(Boolean).join('\n');
  });
  return `Energieart: ${record.input.energyType}, PLZ ${record.input.postalCode}, Verbrauch ${record.input.annualConsumptionKwh} kWh/Jahr.
Quelle: ${c.providerName}, abgerufen ${c.fetchedAt}.
Status der Anfrage: ${STATUS_LABELS[record.status]}.
Angebote:\n${lines.join('\n')}`;
}

/** Regelbasierte Vollständigkeitsprüfung für die Admin-Vorbereitung. */
export function buildSystemSummary(record: RequestRecord): AdminSummary {
  const missing: string[] = [];
  const warnings: string[] = [];
  const sel = selectedOffer(record);
  if (!sel) missing.push('Kein Angebot ausgewählt');
  if (!record.contact?.phone) missing.push('Telefonnummer (optional, für Rückfragen)');
  if (!record.input.desiredStartDate) missing.push('Gewünschter Lieferbeginn');
  if (!record.input.currentProvider) missing.push('Aktueller Anbieter (für Kündigung/Wechsel)');
  missing.push('Lieferadresse, Zählernummer und ggf. Marktlokations-ID (erst bei Vertragsvorbereitung erfragen)');
  if (sel?.offer.source.isDemo) warnings.push('Ausgewähltes Angebot ist ein DEMO-Testangebot und nicht buchbar.');
  if (sel && !sel.complete) warnings.push(`Angebot unvollständig: ${sel.missingFields.join(', ')}`);
  if (record.comparison) {
    const ageH = (Date.now() - new Date(record.comparison.fetchedAt).getTime()) / 3_600_000;
    if (ageH > 24) warnings.push(`Angebotsdaten sind ${Math.round(ageH)} Stunden alt – vor Abschluss erneut prüfen.`);
  }
  const o = sel?.offer;
  const text = [
    `Anfrage ${record.id} (${record.input.energyType === 'gas' ? 'Gas' : 'Strom'}), PLZ ${record.input.postalCode}, ${record.input.annualConsumptionKwh.toLocaleString('de-DE')} kWh/Jahr.`,
    o ? `Gewählt: ${o.providerName} – ${o.tariffName}${o.source.isDemo ? ' [DEMO]' : ''}.` : 'Kein Angebot gewählt.',
    sel?.cost ? `Geschätzte Jahreskosten: ${eur(sel.cost.annualCostWithoutBonusEur)} (1. Jahr mit Bonus: ${eur(sel.cost.firstYearCostWithBonusEur)}).` : '',
    record.contact ? `Kontaktwunsch per ${record.contact.preferredChannel}.${record.contact.message ? ` Nachricht des Kunden: „${record.contact.message}“` : ''}` : '',
  ].filter(Boolean).join(' ');
  return { generatedAt: new Date().toISOString(), generatedBy: 'system', text, missingInformation: missing, warnings };
}

export function buildTemplateDraft(record: RequestRecord): DraftDocument {
  const o = selectedOffer(record)?.offer;
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    kind: 'email_to_customer',
    subject: `Ihre Anfrage ${record.id} bei Daryos`,
    body: `Guten Tag ${record.contact?.name ?? ''},

vielen Dank für Ihre Anfrage zum Tarif „${o?.tariffName ?? '–'}“ von ${o?.providerName ?? '–'}.
Wir haben Ihre Angaben geprüft. Für die weitere Bearbeitung benötigen wir noch:
- Lieferadresse
- Zählernummer
- Name Ihres bisherigen Anbieters und ggf. Kundennummer

Bitte beachten Sie: Dies ist noch kein Vertragsabschluss. Ein Vertrag kommt erst zustande, wenn Sie den Antrag beim Anbieter bestätigen und der Anbieter ihn annimmt.

Mit freundlichen Grüßen
Ihr Daryos-Team`,
  };
}

export interface Assistant {
  readonly configured: boolean;
  readonly detail: string;
  answerCustomer(record: RequestRecord, question: string): Promise<string>;
  improveSummary(record: RequestRecord, base: AdminSummary): Promise<AdminSummary>;
  draftEmail(record: RequestRecord): Promise<DraftDocument>;
}

export class AssistantNotConfiguredError extends Error {}

export class GeminiAssistant implements Assistant {
  readonly configured = true;
  readonly detail: string;
  private ai: GoogleGenAI;

  constructor(apiKey: string, private readonly model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.detail = `Gemini (${model})`;
  }

  private async generate(prompt: string): Promise<string> {
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { systemInstruction: SYSTEM_RULES, temperature: 0.2, maxOutputTokens: 600 },
    });
    const text = res.text?.trim();
    if (!text) throw new Error('Leere Antwort des KI-Modells');
    return text;
  }

  answerCustomer(record: RequestRecord, question: string) {
    return this.generate(`Kontext:\n${offerContext(record)}\n\nFrage des Kunden:\n${question}`);
  }

  async improveSummary(record: RequestRecord, base: AdminSummary): Promise<AdminSummary> {
    const text = await this.generate(
      `Erstelle für den Administrator eine kurze, sachliche Zusammenfassung dieser Anfrage. Nenne Auffälligkeiten und Widersprüche.\n\nKontext:\n${offerContext(record)}\n\nKundennachricht: ${record.contact?.message ?? '–'}\nRegelbasierte Prüfung: fehlend: ${base.missingInformation.join('; ')}; Hinweise: ${base.warnings.join('; ')}`,
    );
    return { ...base, generatedAt: new Date().toISOString(), generatedBy: 'gemini', text };
  }

  async draftEmail(record: RequestRecord): Promise<DraftDocument> {
    const base = buildTemplateDraft(record);
    const body = await this.generate(
      `Formuliere einen E-Mail-Entwurf an den Kunden ${record.contact?.name ?? ''} zu seiner Anfrage. Erfrage die fehlenden Angaben (Lieferadresse, Zählernummer, bisheriger Anbieter). Stelle klar, dass noch kein Vertrag abgeschlossen ist.\n\nKontext:\n${offerContext(record)}`,
    );
    return { ...base, createdBy: 'gemini', body };
  }
}

export class DisabledAssistant implements Assistant {
  readonly configured = false;
  readonly detail = 'KI-Assistent nicht eingerichtet (GEMINI_API_KEY fehlt). Regelbasierte Prüfung ist aktiv.';
  async answerCustomer(): Promise<string> {
    throw new AssistantNotConfiguredError(this.detail);
  }
  async improveSummary(_r: RequestRecord, base: AdminSummary) {
    return base;
  }
  async draftEmail(record: RequestRecord) {
    return buildTemplateDraft(record);
  }
}

export function assistantFromEnv(env: NodeJS.ProcessEnv): Assistant {
  const key = env.GEMINI_API_KEY;
  if (key && key !== 'MY_GEMINI_API_KEY') return new GeminiAssistant(key, env.GEMINI_MODEL || 'gemini-2.5-flash');
  return new DisabledAssistant();
}
