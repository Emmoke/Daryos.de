// KI-Vertragsassistent. Die Vollständigkeitsprüfung und Zusammenfassung funktionieren regelbasiert ohne KI;
// Gemini wird (falls konfiguriert) nur serverseitig und ausschließlich auf Basis der gespeicherten Angebotsdaten genutzt.
import { GoogleGenAI } from '@google/genai';
import { STATUS_LABELS } from '../shared/platform';
import type { RankedOffer } from '../shared/platform';
import type { AdminSummary, DraftDocument, RequestRecord } from './store';
import { randomUUID } from 'node:crypto';
import { buildKnowledgeBase, CONTACT } from './knowledge';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Vom Administrator gepflegte Ergänzungen (siehe assistantConfig.ts). */
export interface ChatOptions {
  extraInstructions?: string;
  knowledge?: { question: string; answer: string }[];
  toolInstructions?: string;
}

export function buildChatPrompt(history: ChatTurn[], opts: ChatOptions = {}): string {
  const transcript = history.map((t) => `${t.role === 'user' ? 'Kunde' : 'Assistent'}: ${t.text}`).join('\n');
  const extraKnowledge = (opts.knowledge ?? []).map((k) => `F: ${k.question}\nA: ${k.answer}`).join('\n\n');
  return [
    `Wissensbasis:\n${buildKnowledgeBase()}`,
    extraKnowledge && `## Ergänzendes Wissen von Daryos\n${extraKnowledge}`,
    opts.toolInstructions && `## Erlaubte Wege für den Kunden\n${opts.toolInstructions}`,
    opts.extraInstructions && `## Zusätzliche Hinweise des Betreibers (die verbindlichen Regeln haben immer Vorrang)\n${opts.extraInstructions}`,
    `Bisheriges Gespräch:\n${transcript}`,
    'Antworte als Assistent auf die letzte Nachricht des Kunden.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

const CHAT_RULES = `Du bist der digitale Assistent von Daryos (Tarifberatung und Wechselservice in Leipzig) auf der Webseite bzw. in WhatsApp.
Regeln (verbindlich):
- Antworte nur auf Basis der Wissensbasis unten. Erfinde niemals Preise, Tarife, Ersparnisse, Anbieterkonditionen oder Termine.
- Für konkrete Angebote verweise auf den Online-Tarifvergleich oder die persönliche Beratung.
- Du schließt keine Verträge ab, sagst nichts verbindlich zu und nimmst keine Kündigungen entgegen.
- Frage nicht nach Bankdaten, Zählernummern, Ausweisdaten oder Passwörtern. Wenn jemand solche Daten sendet, bitte darum, sie im persönlichen Termin zu übermitteln.
- Bei rechtlichen Fragen, Beschwerden, Unsicherheit oder Wunsch nach einem Menschen: biete Rückruf/Termin an (Telefon ${CONTACT.phone}).
- Antworte in der Sprache des Kunden, freundlich, kurz (höchstens 120 Wörter).
- Weise bei Bedarf darauf hin, dass du ein automatischer Assistent bist.`;

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

/** true, wenn jede Zahl aus `original` auch in `rewritten` vorkommt. */
export function keepsAllNumbers(original: string, rewritten: string): boolean {
  const nums = original.match(/\d+(?:[.,]\d+)*/g) ?? [];
  return nums.every((n) => rewritten.includes(n));
}

export function findOffer(record: RequestRecord, offerId?: string): RankedOffer | undefined {
  return (offerId ? record.comparison?.offers.find((o) => o.offer.id === offerId) : undefined) ?? selectedOffer(record);
}

/** Angebots-E-Mail auf Basis der echten Angebotsdaten (Vorlage, ohne KI). */
export function buildTemplateDraft(record: RequestRecord, offerId?: string): DraftDocument {
  const ranked = findOffer(record, offerId);
  const o = ranked?.offer;
  const lines: string[] = [];
  if (o) {
    lines.push(
      `Angebot: ${o.tariffName} (${o.providerName}) – ${o.energyType === 'gas' ? 'Gas' : 'Strom'}`,
      `Arbeitspreis: ${o.workPriceCtPerKwh?.toLocaleString('de-DE')} ct/kWh, Grundpreis: ${o.basePriceEurPerMonth !== null ? eur(o.basePriceEurPerMonth) : '–'} pro Monat (brutto)`,
      `Preisgarantie: ${o.priceGuaranteeMonths ? `${o.priceGuaranteeMonths} Monate${o.priceGuaranteeType ? ` (${o.priceGuaranteeType})` : ''}` : 'keine'}`,
      `Vertragslaufzeit: ${o.contractTermMonths ?? '–'} Monate, Kündigungsfrist: ${o.noticePeriodWeeks ?? '–'} Wochen`,
    );
    if (ranked?.cost) {
      lines.push(`Geschätzte Jahreskosten bei ${record.input.annualConsumptionKwh.toLocaleString('de-DE')} kWh: ${eur(ranked.cost.annualCostWithoutBonusEur)} (ohne Bonus)`);
      if (ranked.cost.oneTimeBonusEur) lines.push(`Im ersten Jahr bei Erfüllung der Bonusbedingungen: ${eur(ranked.cost.firstYearCostWithBonusEur)}`);
    }
    for (const b of o.bonuses) lines.push(`Bonus: ${eur(b.amountEur)} – ${b.conditions} (einmalig)`);
    if (o.officialUrl && !o.source.isDemo) lines.push(`Offizielle Tarifseite des Anbieters: ${o.officialUrl}`);
    lines.push(`Quelle: ${o.source.name}, Stand ${new Date(o.source.fetchedAt).toLocaleDateString('de-DE')}`);
  }
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    kind: 'email_to_customer',
    offerId: o?.id,
    offerIsDemo: o?.source.isDemo ?? false,
    subject: `Ihr Tarifangebot von Daryos – Anfrage ${record.id}`,
    body: `Guten Tag ${record.contact?.name ?? ''},

vielen Dank für Ihre Anfrage. Wir haben Ihre Angaben geprüft und folgendes Angebot für Sie herausgesucht:

${lines.length ? lines.map((l) => `• ${l}`).join('\n') : '• (Bitte Angebot auswählen)'}

Die Kosten sind eine Schätzung auf Basis Ihres angegebenen Verbrauchs; abgerechnet wird Ihr tatsächlicher Verbrauch.

Wenn Ihnen das Angebot zusagt, benötigen wir für den Wechsel noch:
- Lieferadresse
- Zählernummer (steht auf Ihrer letzten Jahresabrechnung)
- Name Ihres bisherigen Anbieters und ggf. Kundennummer

Bitte beachten Sie: Dies ist noch kein Vertragsabschluss. Ein Vertrag kommt erst zustande, wenn Sie den Antrag beim Anbieter bestätigen und der Anbieter ihn annimmt.

Den Stand Ihrer Anfrage können Sie jederzeit mit Ihrer Anfrage-ID ${record.id} auf unserer Webseite abrufen.

Mit freundlichen Grüßen
Ihr Daryos-Team`,
  };
}

export interface Assistant {
  readonly configured: boolean;
  readonly detail: string;
  answerCustomer(record: RequestRecord, question: string): Promise<string>;
  /** Allgemeiner Webseiten-/WhatsApp-Chat auf Basis der freigegebenen Wissensbasis. */
  chat(history: ChatTurn[], opts?: ChatOptions): Promise<string>;
  improveSummary(record: RequestRecord, base: AdminSummary): Promise<AdminSummary>;
  draftEmail(record: RequestRecord, offerId?: string): Promise<DraftDocument>;
  /** Beratungs-Chat für den Inhaber in der Verwaltung (Kontext ohne personenbezogene Kundendaten) */
  adminChat(prompt: string, rules: string): Promise<string>;
  /** Liest Angaben aus einer Rechnung / einem Zählerfoto (PDF, JPG, PNG) – Antwort als JSON-Text */
  readDocument(data: Buffer, mimeType: string, instruction: string): Promise<string>;
}

export class AssistantNotConfiguredError extends Error {}

/** Wählt aus den verfügbaren Modellen das neueste stabile „Flash“-Modell (schnell, günstig). */
export function pickFlashModel(names: string[]): string | undefined {
  const usable = names
    .map((n) => n.replace(/^models\//, ''))
    .filter((n) => /flash/.test(n) && !/(image|tts|audio|live|embed|thinking|lite|robotics|computer)/.test(n));
  const version = (n: string) => Number(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const stable = (n: string) => !/(preview|exp)/.test(n);
  return usable.sort((a, b) => Number(stable(b)) - Number(stable(a)) || version(b) - version(a) || a.length - b.length)[0];
}

export class GeminiAssistant implements Assistant {
  readonly configured = true;
  detail: string;
  private ai: GoogleGenAI;
  private resolved = false;

  constructor(apiKey: string, private model: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.detail = `Gemini (${model})`;
  }

  /** Falls das eingestellte Modell abgeschaltet wurde: verfügbares Modell bei Google abfragen und wechseln */
  private async resolveModel(): Promise<boolean> {
    if (this.resolved) return false;
    this.resolved = true;
    const names: string[] = [];
    for await (const m of await this.ai.models.list()) {
      if (m.name && (!m.supportedActions || m.supportedActions.includes('generateContent'))) names.push(m.name);
    }
    const next = pickFlashModel(names);
    if (!next || next === this.model) return false;
    console.warn(`[daryos] Gemini-Modell „${this.model}“ nicht verfügbar – verwende „${next}“.`);
    this.model = next;
    this.detail = `Gemini (${next})`;
    return true;
  }

  private async generate(prompt: string, systemInstruction = SYSTEM_RULES, maxOutputTokens = 600, temperature = 0.2): Promise<string> {
    let res;
    try {
      res = await this.ai.models.generateContent({ model: this.model, contents: prompt, config: { systemInstruction, temperature, maxOutputTokens } });
    } catch (err) {
      if (!/not found|NOT_FOUND|404|not supported/i.test(String((err as Error)?.message)) || !(await this.resolveModel())) throw err;
      res = await this.ai.models.generateContent({ model: this.model, contents: prompt, config: { systemInstruction, temperature, maxOutputTokens } });
    }
    const text = res.text?.trim();
    if (!text) throw new Error('Leere Antwort des KI-Modells');
    return text;
  }

  chat(history: ChatTurn[], opts?: ChatOptions) {
    return this.generate(buildChatPrompt(history, opts), CHAT_RULES);
  }

  adminChat(prompt: string, rules: string) {
    return this.generate(prompt, rules, 2048, 0.4);
  }

  async readDocument(data: Buffer, mimeType: string, instruction: string) {
    const run = () =>
      this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: data.toString('base64') } }, { text: instruction }] }],
        config: { temperature: 0, maxOutputTokens: 800, responseMimeType: 'application/json' },
      });
    let res;
    try {
      res = await run();
    } catch (err) {
      if (!/not found|NOT_FOUND|404/i.test(String((err as Error)?.message)) || !(await this.resolveModel())) throw err;
      res = await run();
    }
    return res.text ?? '';
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

  async draftEmail(record: RequestRecord, offerId?: string): Promise<DraftDocument> {
    const base = buildTemplateDraft(record, offerId);
    const body = await this.generate(
      `Überarbeite diesen E-Mail-Entwurf an den Kunden sprachlich (freundlich, klar, kurz). Ändere KEINE Zahlen, Preise, Fristen, Links oder Bedingungen und erfinde nichts dazu. Behalte den Hinweis, dass noch kein Vertrag abgeschlossen ist.\n\nEntwurf:\n${base.body}\n\nKundennachricht: ${record.contact?.message ?? '–'}`,
    );
    // Sicherheitsprüfung: Alle Zahlen (Preise, Fristen, IDs) der Vorlage müssen im KI-Text unverändert vorkommen
    if (!keepsAllNumbers(base.body, body)) return base;
    return { ...base, createdBy: 'gemini', body };
  }
}

export class DisabledAssistant implements Assistant {
  readonly configured: boolean = false;
  readonly detail = 'KI-Assistent nicht eingerichtet (GEMINI_API_KEY fehlt). Regelbasierte Prüfung ist aktiv.';
  async answerCustomer(): Promise<string> {
    throw new AssistantNotConfiguredError(this.detail);
  }
  async chat(_history: ChatTurn[], _opts?: ChatOptions): Promise<string> {
    throw new AssistantNotConfiguredError(this.detail);
  }
  async adminChat(_prompt: string, _rules: string): Promise<string> {
    throw new AssistantNotConfiguredError(this.detail);
  }
  async readDocument(_data: Buffer, _mimeType: string, _instruction: string): Promise<string> {
    throw new AssistantNotConfiguredError(this.detail);
  }
  async improveSummary(_r: RequestRecord, base: AdminSummary) {
    return base;
  }
  async draftEmail(record: RequestRecord, offerId?: string) {
    return buildTemplateDraft(record, offerId);
  }
}

export function assistantFromEnv(env: NodeJS.ProcessEnv): Assistant {
  const key = env.GEMINI_API_KEY;
  if (key && key !== 'MY_GEMINI_API_KEY') return new GeminiAssistant(key, env.GEMINI_MODEL || 'gemini-flash-latest');
  return new DisabledAssistant();
}
