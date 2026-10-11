// KI-Mitarbeiter der Verwaltung: Lagebild („Was ist neu? Was ist zu tun?“) und Kontext für den Beratungs-Chat.
// Das Lagebild entsteht regelbasiert aus den echten Daten (funktioniert auch ohne KI). An die KI gehen nur
// sachliche Angaben (Anfrage-ID, Status, Sparte, PLZ-Bereich, Verbrauch, fehlende Angaben) – keine Namen,
// E-Mail-Adressen oder Telefonnummern von Kunden.
import { STATUS_LABELS } from '../shared/platform';
import type { Backend } from './persistence';
import type { RequestRecord } from './store';
import type { Tariff } from './tariffs';
import type { Invoice } from './accounting';
import type { Appointment } from './appointments';

export interface BriefingItem {
  level: 'wichtig' | 'hinweis' | 'info' | 'ok';
  text: string;
  href?: string;
}

export interface CopilotInput {
  now: Date;
  since?: string;
  requests: RequestRecord[];
  tariffs: Tariff[];
  invoices: Invoice[];
  settingsMissing: string[];
  whatsapp: { configured: boolean; needsHuman: number; conversations: number };
  connections: { gemini: boolean; email: boolean };
  chat?: { sessionsLast7Days: number; handoverRate: number; topQuestions: { question: string; count: number }[] };
  /** Aktuelle Einstellungen des Webseiten-Chats (damit der Assistent Verbesserungen vorschlagen kann) */
  chatConfig?: { extraInstructions: string; knowledge: { question: string; answer: string }[]; tools: { [k: string]: boolean } | object; storeTranscripts: boolean };
  /** Letzte Kundenfragen, bei denen der Chat nicht helfen konnte oder ein Mensch gewünscht wurde */
  chatProblems?: string[];
  /** Auswertung der letzten 30 Tage (nur Zählwerte) */
  appointments?: Appointment[];
  analytics?: { totals: { visits: number; comparisons: number; contacts: number; conversion: number; comparisonsWithoutRealOffer: number }; byRegion: { key: string; count: number }[]; byBand: { key: string; count: number }[]; noRealOffer: { key: string; count: number }[]; selectedOffers: { key: string; count: number }[]; referrers: { key: string; count: number }[]; insights: string[] };
}

const DAY = 86_400_000;
const daysSince = (iso: string, now: Date) => Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
const ids = (rs: RequestRecord[], max = 3) => rs.slice(0, max).map((r) => r.id).join(', ') + (rs.length > max ? ' …' : '');
const OPEN = new Set(['CUSTOMER_CONTACTED', 'WAITING_FOR_ADMIN', 'APPROVED', 'SUBMITTED', 'ERROR']);

export function buildBriefing(i: CopilotInput): BriefingItem[] {
  const items: BriefingItem[] = [];
  const today = i.now.toISOString().slice(0, 10);
  const withContact = i.requests.filter((r) => r.contact);

  if (i.since) {
    const fresh = withContact.filter((r) => r.createdAt > i.since!);
    if (fresh.length) items.push({ level: 'info', text: `${fresh.length} neue Kundenanfrage(n) seit Ihrem letzten Besuch: ${ids(fresh)}`, href: `#/anfragen/${fresh[0].id}` });
    const uploads = i.requests.filter((r) => (r.documents ?? []).some((d) => d.uploadedAt > i.since! && d.uploadedBy === 'kunde'));
    if (uploads.length) items.push({ level: 'info', text: `Neue Unterlagen von Kunden bei ${ids(uploads)}`, href: `#/anfragen/${uploads[0].id}` });
  }

  const waiting = withContact.filter((r) => r.status === 'WAITING_FOR_ADMIN');
  const old = waiting.filter((r) => daysSince(r.updatedAt, i.now) >= 1);
  if (old.length) items.push({ level: 'wichtig', text: `${old.length} Anfrage(n) warten seit über 24 Stunden auf Ihre Prüfung: ${ids(old)}`, href: `#/anfragen/${old[0].id}` });
  else if (waiting.length) items.push({ level: 'hinweis', text: `${waiting.length} Anfrage(n) warten auf Ihre Prüfung: ${ids(waiting)}`, href: `#/anfragen/${waiting[0].id}` });

  const followUp = withContact.filter((r) => ['WAITING_FOR_ADMIN', 'APPROVED'].includes(r.status) && r.drafts.some((d) => d.sentAt && daysSince(d.sentAt, i.now) >= 3));
  if (followUp.length) items.push({ level: 'hinweis', text: `Angebot vor über 3 Tagen gesendet, noch keine Zusage – nachfassen: ${ids(followUp)}`, href: `#/anfragen/${followUp[0].id}` });

  const submitted = i.requests.filter((r) => r.status === 'SUBMITTED' && daysSince(r.updatedAt, i.now) >= 7);
  if (submitted.length) items.push({ level: 'hinweis', text: `Beim Anbieter eingereicht, seit über 7 Tagen keine Bestätigung – nachfragen: ${ids(submitted)}`, href: `#/anfragen/${submitted[0].id}` });

  const errors = i.requests.filter((r) => r.status === 'ERROR');
  if (errors.length) items.push({ level: 'wichtig', text: `${errors.length} Anfrage(n) mit Fehler: ${ids(errors)}`, href: `#/anfragen/${errors[0].id}` });

  const appts = i.appointments ?? [];
  const asked = appts.filter((a) => a.status === 'angefragt');
  if (asked.length) items.push({ level: 'wichtig', text: `${asked.length} Terminanfrage(n) warten auf Ihre Bestätigung: ${asked.slice(0, 3).map((a) => `${a.id} (${a.wish?.date} ${a.wish?.time})`).join(', ')}`, href: '#/termine' });
  const tomorrow = new Date(i.now.getTime() + DAY).toISOString().slice(0, 10);
  const soonAppts = appts.filter((a) => a.status === 'bestaetigt' && a.confirmed && (a.confirmed.date === today || a.confirmed.date === tomorrow));
  if (soonAppts.length) items.push({ level: 'hinweis', text: `Termine heute/morgen: ${soonAppts.map((a) => `${a.confirmed!.date === today ? 'heute' : 'morgen'} ${a.confirmed!.time} (${a.format})`).join(', ')}`, href: '#/termine' });
  const pastOpen = appts.filter((a) => a.status === 'bestaetigt' && a.confirmed && a.confirmed.date < today);
  if (pastOpen.length) items.push({ level: 'info', text: `${pastOpen.length} vergangene(r) Termin(e) noch als „erledigt“ markieren`, href: '#/termine' });

  if (i.whatsapp.needsHuman) items.push({ level: 'wichtig', text: `${i.whatsapp.needsHuman} WhatsApp-Gespräch(e) brauchen Ihre Antwort`, href: '#/whatsapp' });

  const active = i.tariffs.filter((t) => t.active);
  const current = active.filter((t) => t.validFrom <= today && t.validUntil >= today);
  const soon = current.filter((t) => t.validUntil <= new Date(i.now.getTime() + 7 * DAY).toISOString().slice(0, 10));
  const expired = active.filter((t) => t.validUntil < today);
  if (!current.length) items.push({ level: 'hinweis', text: 'Kein gültiger Tarif im Katalog – Kunden sehen im Vergleich DEMO-Beispiele. Tragen Sie echte Tarife ein.', href: '#/tarife' });
  if (soon.length) items.push({ level: 'hinweis', text: `${soon.length} Tarif(e) laufen in den nächsten 7 Tagen ab: ${soon.slice(0, 3).map((t) => t.tariffName).join(', ')}`, href: '#/tarife' });
  if (expired.length) items.push({ level: 'info', text: `${expired.length} abgelaufene(r) Tarif(e) – aktualisieren oder deaktivieren`, href: '#/tarife' });

  const overdue = i.invoices.filter((x) => x.kind === 'rechnung' && x.status === 'offen' && x.dueDate < today);
  if (overdue.length) items.push({ level: 'wichtig', text: `${overdue.length} Rechnung(en) überfällig: ${overdue.slice(0, 3).map((x) => x.number).join(', ')}`, href: '#/buchhaltung' });
  if (i.settingsMissing.length) items.push({ level: 'info', text: `Firmendaten für Rechnungen unvollständig: ${i.settingsMissing.join(', ')}`, href: '#/einstellungen' });

  if (!i.connections.email) items.push({ level: 'hinweis', text: 'E-Mail ist nicht verbunden – keine Benachrichtigungen, kein Angebotsversand, kein Kundenkonto.', href: '#/einstellungen' });
  if (!i.connections.gemini) items.push({ level: 'info', text: 'Gemini ist nicht verbunden – Chat auf der Webseite und dieser Assistent antworten noch nicht mit KI.', href: '#/einstellungen' });

  if (i.chat && i.chat.sessionsLast7Days) items.push({ level: 'info', text: `Webseiten-Chat: ${i.chat.sessionsLast7Days} Gespräch(e) in 7 Tagen, ${i.chat.handoverRate} % wollten persönlichen Kontakt`, href: '#/assistent' });

  const order = { wichtig: 0, hinweis: 1, info: 2, ok: 3 };
  items.sort((a, b) => order[a.level] - order[b.level]);
  if (!items.some((x) => x.level === 'wichtig' || x.level === 'hinweis')) items.push({ level: 'ok', text: 'Nichts Dringendes offen. Gute Gelegenheit, Tarife zu pflegen oder den Chat-Assistenten zu verbessern.' });
  return items;
}

/** Sachlicher Kontext für den KI-Chat – ohne personenbezogene Kundendaten */
export function buildCopilotContext(i: CopilotInput, briefing: BriefingItem[]): string {
  const today = i.now.toISOString().slice(0, 10);
  const open = i.requests.filter((r) => OPEN.has(r.status)).slice(0, 40);
  const reqLines = open.map((r) => {
    const sel = r.comparison?.offers.find((o) => o.offer.id === r.selectedOfferId)?.offer;
    const parts = [
      r.id,
      STATUS_LABELS[r.status],
      r.input.energyType === 'gas' ? 'Gas' : 'Strom',
      `PLZ ${String(r.input.postalCode).slice(0, 2)}…`,
      `${r.input.annualConsumptionKwh} kWh/Jahr`,
      `erstellt ${r.createdAt.slice(0, 10)}`,
      `zuletzt ${r.updatedAt.slice(0, 10)}`,
      r.contact ? 'Kontaktdaten vorhanden' : 'nur Vergleich',
      sel ? `Angebot: ${sel.providerName} – ${sel.tariffName}${sel.source.isDemo ? ' (DEMO)' : ''}` : '',
      r.summary?.missingInformation.length ? `fehlt: ${r.summary.missingInformation.join('; ')}` : '',
      r.summary?.warnings.length ? `Hinweise: ${r.summary.warnings.join('; ')}` : '',
      r.drafts.some((d) => d.sentAt) ? `Angebots-E-Mail gesendet am ${r.drafts.filter((d) => d.sentAt).pop()!.sentAt!.slice(0, 10)}` : r.drafts.length ? 'Entwurf vorhanden, nicht gesendet' : '',
      (r.documents ?? []).length ? `${r.documents!.length} Unterlage(n)` : '',
      r.application ? `Antrag: ${r.application.status}, ${r.application.checks.filter((c) => c.level === 'fehler').length} offene Fehler` : '',
    ];
    return '- ' + parts.filter(Boolean).join(' | ');
  });
  const tariffLines = i.tariffs.slice(0, 40).map((t) => `- ${t.energyType} | ${t.providerName} – ${t.tariffName} | ${t.workPriceCtPerKwh} ct/kWh, ${t.basePriceEurPerMonth} €/Monat | gültig ${t.validFrom} bis ${t.validUntil} | ${t.active ? 'aktiv' : 'inaktiv'} | PLZ ${t.postalCodes.join(',') || 'alle'}`);
  const openInv = i.invoices.filter((x) => x.kind === 'rechnung' && x.status === 'offen');
  return [
    `Heute: ${today}`,
    `## Lagebild\n${briefing.map((b) => `- [${b.level}] ${b.text}`).join('\n')}`,
    `## Offene Anfragen (${open.length})\n${reqLines.join('\n') || '- keine'}`,
    `## Tarifkatalog (${i.tariffs.length})\n${tariffLines.join('\n') || '- leer (Webseite zeigt DEMO-Beispiele)'}`,
    `## Termine\n${(i.appointments ?? []).filter((a) => a.status === 'angefragt' || a.status === 'bestaetigt').slice(0, 20).map((a) => `- ${a.id} | ${a.status} | ${a.confirmed ? `${a.confirmed.date} ${a.confirmed.time}` : `Wunsch ${a.wish?.date} ${a.wish?.time}`} | ${a.format} | ${a.service}${a.requestId ? ` | Anfrage ${a.requestId}` : ''}`).join('\n') || '- keine'}`,
    `## Buchhaltung\n- offene Rechnungen: ${openInv.length}, davon überfällig: ${openInv.filter((x) => x.dueDate < today).length}, Summe offen: ${(openInv.reduce((s, x) => s + x.grossCents, 0) / 100).toFixed(2)} €`,
    `## WhatsApp\n- ${i.whatsapp.configured ? `${i.whatsapp.conversations} Gespräche, ${i.whatsapp.needsHuman} brauchen Antwort` : 'nicht verbunden'}`,
    `## Verbindungen\n- Gemini: ${i.connections.gemini ? 'verbunden' : 'nicht verbunden'}; E-Mail: ${i.connections.email ? 'verbunden' : 'nicht verbunden'}`,
    i.chatConfig
      ? `## Einstellungen des Webseiten-Chats\n- Zusatzanweisungen: ${i.chatConfig.extraInstructions ? `„${i.chatConfig.extraInstructions.slice(0, 1500)}“` : 'keine'}\n- Werkzeuge: ${Object.entries(i.chatConfig.tools as Record<string, boolean>).map(([k, v]) => `${k}=${v ? 'an' : 'aus'}`).join(', ')}\n- Wissen (${i.chatConfig.knowledge.length} Einträge): ${i.chatConfig.knowledge.slice(0, 40).map((k) => `„${k.question.slice(0, 100)}“`).join('; ') || 'keins'}`
      : '',
    i.chatProblems?.length ? `## Kundenfragen, bei denen der Chat nicht weiterhelfen konnte oder ein Mensch gewünscht wurde\n${i.chatProblems.map((q) => `- „${q}“`).join('\n')}` : '',
    i.analytics
      ? `## Auswertung Webseite (30 Tage, nur Zählwerte)\n- Besuche (mit Einwilligung): ${i.analytics.totals.visits}, Vergleiche: ${i.analytics.totals.comparisons}, Anfragen: ${i.analytics.totals.contacts}, Abschlussquote Vergleich→Anfrage: ${i.analytics.totals.conversion} %\n- Vergleiche ohne echten Tarif: ${i.analytics.totals.comparisonsWithoutRealOffer}; Regionen: ${i.analytics.noRealOffer.map((x) => `${x.key} (${x.count})`).join(', ') || '–'}\n- PLZ-Bereiche: ${i.analytics.byRegion.map((x) => `${x.key} (${x.count})`).join(', ') || '–'}\n- Verbrauchsklassen: ${i.analytics.byBand.map((x) => `${x.key} (${x.count})`).join(', ') || '–'}\n- Gewählte Angebote: ${i.analytics.selectedOffers.map((x) => `${x.key} (${x.count})`).join(', ') || '–'}\n- Herkunft: ${i.analytics.referrers.map((x) => `${x.key} (${x.count})`).join(', ') || '–'}\n- Hinweise: ${i.analytics.insights.join(' ')}`
      : '',
    i.chat ? `## Webseiten-Chat (7 Tage)\n- ${i.chat.sessionsLast7Days} Gespräche, Übergabe an Mensch ${i.chat.handoverRate} %\n- häufige Fragen: ${i.chat.topQuestions.slice(0, 5).map((q) => `„${q.question}“ (${q.count})`).join(', ') || '–'}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export const COPILOT_RULES = `Du bist der digitale Mitarbeiter in der Verwaltung von Daryos (Strom-/Gas-Tarifberatung und Wechselservice in Leipzig, Kleingewerbe).
Du sprichst mit dem Inhaber. Antworte auf Deutsch, klar, freundlich und praktisch – wie eine erfahrene Büro-Assistenz.

Deine Aufgaben:
- Lagebild erklären: was ist neu, was ist dringend, was zuerst tun (mit Anfrage-IDs DY-…).
- Beraten: Ablauf einer Anfrage, Prüfung, Tarifpflege, Kundenkommunikation, Buchhaltung, Organisation, Ideen für Automatisierung und Marketing.
- Texte entwerfen: Antworten an Kunden, Nachfass-E-Mails, WhatsApp-Nachrichten, FAQ-Einträge, Tarifbeschreibungen.
- Auf Wunsch Tages- oder Wochenplan erstellen.
- Die Auswertung der Webseite deuten: wo fehlen Tarife (Regionen ohne echtes Angebot), welche Verbrauchsgruppen, wie gut wird aus Vergleichen eine Anfrage – und konkrete Verbesserungen vorschlagen.

Verbindliche Regeln:
- Nutze für Fakten über Anfragen, Tarife, Rechnungen nur den Kontext unten. Erfinde keine Anfragen, Preise, Tarife, Kunden oder Zahlen. Wenn etwas fehlt, sag es.
- Du kannst selbst nichts ausführen (keine E-Mails senden, nichts freigeben, keine Verträge, keine Änderungen). Sage genau, wo der Inhaber es in der Verwaltung erledigt, z. B. „Anfragen → DY-… → Angebot an den Kunden“.
- Kundentexte, die du entwirfst, sind Entwürfe zur Prüfung. Keine verbindlichen Zusagen, keine erfundenen Konditionen; DEMO-Angebote nie als echt darstellen.
- Rechtliche und steuerliche Fragen: allgemeine Orientierung geben und auf Anwalt bzw. Steuerberater verweisen (z. B. § 34d GewO, DSGVO, Kleinunternehmerregelung).
- Kundendaten wie Namen oder E-Mail-Adressen siehst du nicht; verweise dafür auf die Anfrage in der Verwaltung.

Steuerung des Webseiten-Chats (Kunden-Assistent):
- Du kannst die Einstellungen des Kunden-Chats analysieren (Kontext unten) und Verbesserungen vorschlagen: fehlendes Wissen, bessere Anweisungen.
- Ein konkreter Vorschlag, den der Inhaber mit einem Klick übernehmen kann, steht jeweils in einem eigenen Block, genau so:
\`\`\`vorschlag
{"typ":"wissen","frage":"Kurze Kundenfrage","antwort":"Sachliche Antwort ohne Preise oder Zusagen"}
\`\`\`
oder
\`\`\`vorschlag
{"typ":"anweisung","text":"Zusätzliche Verhaltensregel für den Kunden-Chat"}
\`\`\`
- Höchstens 5 Vorschläge pro Antwort, gültiges JSON, nur wenn sinnvoll oder gewünscht. Erkläre vor dem Block kurz, warum. Nichts erfinden (keine Preise, Öffnungszeiten oder Leistungen, die nicht im Kontext stehen – sonst Platzhalter wie [bitte ergänzen] verwenden).

Wichtige Orte in der Verwaltung: Übersicht · Anfragen (Prüfen, Angebot an den Kunden, Unterlagen, Freigabe) · Tarife (eigener Katalog, ersetzt DEMO) · WhatsApp · KI-Assistent (Webseiten-Chat steuern) · Buchhaltung (Rechnungen, Buchungen, Export) · Einstellungen (Verbindungen, Firmendaten, Sicherheit) · Anleitung.
Ablauf: Kunde vergleicht → Anfrage mit Kontakt → automatische Vorbereitung (Status „Wartet auf Prüfung“) → Inhaber prüft → Angebots-E-Mail entwerfen, prüfen, senden → nach Zusage freigeben → Antrag im Anbieterportal → „Beim Anbieter eingereicht“ → mit Bestätigungsnummer „abgeschlossen“.`;

export function buildCopilotPrompt(history: { role: 'user' | 'assistant'; text: string }[], context: string) {
  const transcript = history.map((t) => `${t.role === 'user' ? 'Inhaber' : 'Assistent'}: ${t.text}`).join('\n');
  return `## Aktueller Stand der Verwaltung\n${context}\n\n## Gespräch\n${transcript}\nAssistent:`;
}

/** Merkt sich pro Administrator den letzten Besuch (für „seit Ihrem letzten Besuch“) */
export class CopilotStore {
  private seen = new Map<string, string>();
  private constructor(private readonly backend?: Backend) {}
  static async open(backend?: Backend) {
    const s = new CopilotStore(backend);
    if (backend) for (const d of await backend.loadAll<{ email: string; lastSeenAt: string }>('copilot_meta')) s.seen.set(d.email, d.lastSeenAt);
    return s;
  }
  lastSeen(email: string) {
    return this.seen.get(email);
  }
  async markSeen(email: string, at: string) {
    await this.backend?.put('copilot_meta', email.replace(/[^a-zA-Z0-9]/g, '_'), { email, lastSeenAt: at });
    this.seen.set(email, at);
  }
}
