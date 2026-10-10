// Steuerung des KI-Assistenten durch den Administrator: zusätzliche Anweisungen, eigenes Wissen (Fragen & Antworten),
// Werkzeuge (welche Wege der Assistent anbieten darf) sowie Chat-Verläufe zur Auswertung.
import { randomUUID } from 'node:crypto';
import type { Backend } from './persistence';

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
}

export interface AssistantTools {
  /** Auf den Online-Tarifvergleich verweisen */
  comparison: boolean;
  /** Terminbuchung anbieten */
  booking: boolean;
  /** WhatsApp / Rückruf anbieten */
  whatsapp: boolean;
  /** Anfragestatus erklären (Status-Seite mit Anfrage-ID) */
  status: boolean;
}

export interface AssistantSettings {
  extraInstructions: string;
  knowledge: KnowledgeEntry[];
  tools: AssistantTools;
  storeTranscripts: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

export interface ChatSession {
  id: string;
  startedAt: string;
  updatedAt: string;
  channel: 'web';
  messages: ChatMessage[];
  handover: boolean;
  failed: number;
  deleteAfter: string;
}

export const DEFAULT_ASSISTANT_SETTINGS: AssistantSettings = {
  extraInstructions: '',
  knowledge: [],
  tools: { comparison: true, booking: true, whatsapp: true, status: true },
  storeTranscripts: true,
};

export class AssistantConfigError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

const CONFIG = 'assistant_config';
const SESSIONS = 'chat_sessions';
const RETENTION_DAYS = 30;
export const SESSION_ID_PATTERN = /^[0-9a-f-]{36}$/;
const HANDOVER = /\b(mensch|mitarbeiter|berater|rückruf|termin|whatsapp|beschwerde)\b/i;

/** Werkzeug-Anweisungen für den Prompt – nur freigegebene Wege werden angeboten. */
export function toolInstructions(t: AssistantTools): string {
  const lines: string[] = [];
  lines.push(t.comparison ? '- Für konkrete Preise: auf den Online-Tarifvergleich verweisen (Menüpunkt „Tarifvergleich“).' : '- Den Online-Tarifvergleich NICHT erwähnen.');
  lines.push(t.booking ? '- Bei Beratungswunsch: Terminbuchung über den Knopf „Termin“ anbieten.' : '- Keine Terminbuchung anbieten.');
  lines.push(t.whatsapp ? '- Für persönlichen Kontakt: WhatsApp oder Rückruf anbieten.' : '- WhatsApp NICHT anbieten.');
  lines.push(t.status ? '- Fragen zum Bearbeitungsstand: auf die Status-Seite mit der Anfrage-ID (DY-…) verweisen.' : '- Keine Auskünfte zum Anfragestatus geben, sondern an Daryos verweisen.');
  return lines.join('\n');
}

export class AssistantConfigStore {
  private settings: AssistantSettings = structuredClone(DEFAULT_ASSISTANT_SETTINGS);
  private sessions = new Map<string, ChatSession>();
  private constructor(private readonly backend?: Backend, private readonly now: () => Date = () => new Date()) {}

  static async open(backend?: Backend, now?: () => Date) {
    const s = new AssistantConfigStore(backend, now);
    if (backend) {
      const cfg = (await backend.loadAll<{ key: string; value: AssistantSettings }>(CONFIG)).find((c) => c.key === 'settings');
      if (cfg) s.settings = { ...structuredClone(DEFAULT_ASSISTANT_SETTINGS), ...cfg.value, tools: { ...DEFAULT_ASSISTANT_SETTINGS.tools, ...cfg.value.tools } };
      for (const x of await backend.loadAll<ChatSession>(SESSIONS)) s.sessions.set(x.id, x);
    }
    return s;
  }

  getSettings() {
    return structuredClone(this.settings);
  }

  async updateSettings(body: unknown, actor: string) {
    const b = (body ?? {}) as Record<string, any>;
    const errors: Record<string, string> = {};
    const extraInstructions = typeof b.extraInstructions === 'string' ? b.extraInstructions.trim() : this.settings.extraInstructions;
    if (extraInstructions.length > 4000) errors.extraInstructions = 'Höchstens 4.000 Zeichen.';
    const rawKnowledge = Array.isArray(b.knowledge) ? b.knowledge : this.settings.knowledge;
    if (rawKnowledge.length > 100) errors.knowledge = 'Höchstens 100 Einträge.';
    const knowledge: KnowledgeEntry[] = [];
    rawKnowledge.slice(0, 100).forEach((k: any, i: number) => {
      const question = String(k?.question ?? '').trim().slice(0, 300);
      const answer = String(k?.answer ?? '').trim().slice(0, 2000);
      if (!question && !answer) return;
      if (!question || !answer) errors[`knowledge.${i}`] = 'Frage und Antwort angeben.';
      knowledge.push({ id: typeof k?.id === 'string' && k.id ? k.id : randomUUID(), question, answer });
    });
    const t = b.tools ?? {};
    const tools: AssistantTools = {
      comparison: typeof t.comparison === 'boolean' ? t.comparison : this.settings.tools.comparison,
      booking: typeof t.booking === 'boolean' ? t.booking : this.settings.tools.booking,
      whatsapp: typeof t.whatsapp === 'boolean' ? t.whatsapp : this.settings.tools.whatsapp,
      status: typeof t.status === 'boolean' ? t.status : this.settings.tools.status,
    };
    if (Object.keys(errors).length) throw new AssistantConfigError('Bitte prüfen Sie die Angaben.', errors);
    const next: AssistantSettings = {
      extraInstructions,
      knowledge,
      tools,
      storeTranscripts: typeof b.storeTranscripts === 'boolean' ? b.storeTranscripts : this.settings.storeTranscripts,
      updatedAt: this.now().toISOString(),
      updatedBy: actor,
    };
    await this.backend?.put(CONFIG, 'settings', { key: 'settings', value: next });
    this.settings = next;
    return this.getSettings();
  }

  /** Speichert einen Chat-Austausch (nur wenn aktiviert). Gibt die Sitzungs-ID zurück. */
  async record(sessionId: string | undefined, userText: string, reply: string | null) {
    if (!this.settings.storeTranscripts) return undefined;
    const iso = this.now().toISOString();
    const id = sessionId && SESSION_ID_PATTERN.test(sessionId) && this.sessions.has(sessionId) ? sessionId : randomUUID();
    const s: ChatSession = structuredClone(this.sessions.get(id)) ?? { id, startedAt: iso, updatedAt: iso, channel: 'web', messages: [], handover: false, failed: 0, deleteAfter: iso };
    s.messages.push({ role: 'user', text: userText.slice(0, 1000), at: iso });
    if (reply) s.messages.push({ role: 'assistant', text: reply.slice(0, 4000), at: iso });
    else s.failed += 1;
    s.messages = s.messages.slice(-60);
    if (HANDOVER.test(userText)) s.handover = true;
    s.updatedAt = iso;
    s.deleteAfter = new Date(this.now().getTime() + RETENTION_DAYS * 86_400_000).toISOString();
    await this.backend?.put(SESSIONS, id, s);
    this.sessions.set(id, s);
    return id;
  }

  listSessions() {
    return [...this.sessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((s) => structuredClone(s));
  }

  getSession(id: string) {
    const s = this.sessions.get(id);
    return s ? structuredClone(s) : undefined;
  }

  async deleteSession(id: string) {
    if (!this.sessions.has(id)) return false;
    await this.backend?.remove(SESSIONS, id);
    this.sessions.delete(id);
    return true;
  }

  async purgeExpired(now: Date) {
    const iso = now.toISOString();
    let n = 0;
    for (const [id, s] of [...this.sessions]) {
      if (s.deleteAfter < iso) {
        await this.backend?.remove(SESSIONS, id);
        this.sessions.delete(id);
        n++;
      }
    }
    return n;
  }

  /** Auswertung für das Dashboard */
  stats(now = this.now()) {
    const all = this.listSessions();
    const since = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
    const last7 = all.filter((s) => s.startedAt >= since(7));
    const userMsgs = all.flatMap((s) => s.messages.filter((m) => m.role === 'user'));
    const firstQuestions = new Map<string, number>();
    for (const s of all) {
      const q = s.messages.find((m) => m.role === 'user')?.text.trim().toLowerCase().replace(/[?!.]+$/, '').slice(0, 80);
      if (q) firstQuestions.set(q, (firstQuestions.get(q) ?? 0) + 1);
    }
    return {
      sessions: all.length,
      sessionsLast7Days: last7.length,
      userMessages: userMsgs.length,
      avgMessagesPerSession: all.length ? Math.round((userMsgs.length / all.length) * 10) / 10 : 0,
      handoverRate: all.length ? Math.round((all.filter((s) => s.handover).length / all.length) * 100) : 0,
      failedReplies: all.reduce((n, s) => n + s.failed, 0),
      topQuestions: [...firstQuestions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([question, count]) => ({ question, count })),
    };
  }
}
