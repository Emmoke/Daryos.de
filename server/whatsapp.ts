// WhatsApp-Anbindung über die offizielle WhatsApp Business Platform (Cloud API von Meta).
//
// Sicherheit:
// - Webhook-Verifizierung (GET) nur mit WHATSAPP_VERIFY_TOKEN
// - Jede eingehende Nachricht (POST) muss mit X-Hub-Signature-256 (HMAC-SHA256 mit WHATSAPP_APP_SECRET) signiert sein
// - Zugangstoken nur serverseitig; Versand nur innerhalb des 24-Stunden-Kundenservice-Fensters (sonst Vorlage nötig)
// - Opt-out per "STOP", Übergabe an einen Menschen, Duplikaterkennung über Nachrichten-IDs
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Backend } from './persistence';
import type { Assistant, ChatTurn } from './assistant';
import { HANDOVER_PATTERN, OPT_OUT_PATTERN } from './knowledge';
import { REQUEST_ID_PATTERN, type RequestStore } from './store';
import { logNote } from './workflow';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  graphVersion: string;
  autoReply: boolean;
}

export function whatsappConfigFromEnv(env: NodeJS.ProcessEnv): WhatsAppConfig | undefined {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN } = env;
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_APP_SECRET || !WHATSAPP_VERIFY_TOKEN) return undefined;
  return {
    accessToken: WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
    appSecret: WHATSAPP_APP_SECRET,
    verifyToken: WHATSAPP_VERIFY_TOKEN,
    graphVersion: env.WHATSAPP_GRAPH_VERSION || 'v21.0',
    autoReply: env.WHATSAPP_AUTO_REPLY !== 'false',
  };
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function verifySignature(rawBody: Buffer | undefined, header: string | undefined, appSecret: string): boolean {
  if (!rawBody || !header?.startsWith('sha256=')) return false;
  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return safeEqual(header, expected);
}

export function verifyChallenge(query: Record<string, unknown>, verifyToken: string): string | undefined {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  if (mode === 'subscribe' && typeof token === 'string' && typeof challenge === 'string' && safeEqual(token, verifyToken)) return challenge;
  return undefined;
}

// ---------- Versand ----------

export interface WhatsAppSender {
  sendText(to: string, text: string): Promise<{ ok: boolean; id?: string; error?: string }>;
}

export class CloudApiSender implements WhatsAppSender {
  constructor(private readonly cfg: WhatsAppConfig) {}
  async sendText(to: string, text: string) {
    try {
      const res = await fetch(`https://graph.facebook.com/${this.cfg.graphVersion}/${this.cfg.phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.cfg.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text.slice(0, 4000) } }),
        signal: AbortSignal.timeout(10_000),
      });
      const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
      if (!res.ok) return { ok: false, error: json.error?.message?.slice(0, 200) ?? `HTTP ${res.status}` };
      return { ok: true, id: json.messages?.[0]?.id };
    } catch (err) {
      return { ok: false, error: (err as Error).message.slice(0, 200) };
    }
  }
}

// ---------- Gesprächsspeicher ----------

export interface WaMessage {
  id: string;
  at: string;
  direction: 'in' | 'out';
  author: 'kunde' | 'bot' | string; // string = admin:<email>
  text: string;
  status?: 'sent' | 'failed';
  error?: string;
}

export interface WaConversation {
  waId: string; // Telefonnummer im internationalen Format ohne +
  name?: string;
  createdAt: string;
  updatedAt: string;
  lastInboundAt?: string;
  linkedRequestId?: string;
  optedOut: boolean;
  needsHuman: boolean;
  messages: WaMessage[];
  deleteAfter: string;
}

const COLLECTION = 'whatsapp_conversations';

export class ConversationStore {
  private conversations = new Map<string, WaConversation>();
  private seenIds = new Set<string>();

  constructor(private readonly backend?: Backend) {}

  static async open(backend?: Backend) {
    const store = new ConversationStore(backend);
    for (const c of backend ? await backend.loadAll<WaConversation>(COLLECTION) : []) {
      store.conversations.set(c.waId, c);
      c.messages.forEach((m) => store.seenIds.add(m.id));
    }
    return store;
  }

  /** true, wenn die Nachrichten-ID schon verarbeitet wurde (Meta stellt Webhooks ggf. mehrfach zu). */
  seen(id: string) {
    if (this.seenIds.has(id)) return true;
    this.seenIds.add(id);
    return false;
  }

  get(waId: string) {
    const c = this.conversations.get(waId);
    return c ? structuredClone(c) : undefined;
  }

  list() {
    return [...this.conversations.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((c) => structuredClone(c));
  }

  async upsert(waId: string, mutate: (c: WaConversation) => void, now: Date, retentionDays: number) {
    const iso = now.toISOString();
    const existing = this.conversations.get(waId);
    const c: WaConversation = existing ? structuredClone(existing) : { waId, createdAt: iso, updatedAt: iso, optedOut: false, needsHuman: false, messages: [], deleteAfter: iso };
    mutate(c);
    c.updatedAt = iso;
    c.deleteAfter = new Date(now.getTime() + retentionDays * 86_400_000).toISOString();
    await this.backend?.put(COLLECTION, waId, c);
    this.conversations.set(waId, c);
    return structuredClone(c);
  }

  async purgeExpired(now: Date) {
    const iso = now.toISOString();
    let n = 0;
    for (const [k, c] of [...this.conversations]) {
      if (c.deleteAfter < iso) {
        await this.backend?.remove(COLLECTION, k);
        this.conversations.delete(k);
        n++;
      }
    }
    return n;
  }
}

// ---------- Verarbeitung eingehender Nachrichten ----------

export const BOT_TEXTS = {
  optOut: 'Sie erhalten von Daryos keine automatischen WhatsApp-Nachrichten mehr. Schreiben Sie „START“, um sie wieder zu erhalten.',
  handover: 'Danke für Ihre Nachricht! Ein Mitarbeiter von Daryos meldet sich persönlich bei Ihnen – in der Regel innerhalb eines Werktags.',
  notConfigured: 'Danke für Ihre Nachricht! Daryos meldet sich persönlich bei Ihnen.',
  nonText: 'Danke! Dateien und Sprachnachrichten prüft ein Mitarbeiter persönlich. Bitte senden Sie keine Ausweis- oder Bankdaten per WhatsApp.',
};

export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface IncomingMessage {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  timestamp?: string;
}

export interface WhatsAppDeps {
  store: ConversationStore;
  sender: WhatsAppSender;
  assistant: Assistant;
  requests: RequestStore;
  autoReply: boolean;
  retentionDays: number;
  now: () => Date;
}

/** Wertet einen (bereits signaturgeprüften) Webhook-Body aus. */
export async function handleWebhook(body: any, deps: WhatsAppDeps): Promise<number> {
  let processed = 0;
  for (const entry of Array.isArray(body?.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      const names = new Map<string, string>(
        (Array.isArray(value?.contacts) ? value.contacts : []).map((c: any) => [String(c?.wa_id), String(c?.profile?.name ?? '').slice(0, 80)]),
      );
      for (const msg of (Array.isArray(value?.messages) ? value.messages : []) as IncomingMessage[]) {
        if (typeof msg?.id !== 'string' || typeof msg?.from !== 'string' || !/^\d{6,15}$/.test(msg.from)) continue;
        if (deps.store.seen(msg.id)) continue;
        await handleMessage(msg, names.get(msg.from), deps);
        processed++;
      }
    }
  }
  return processed;
}

async function handleMessage(msg: IncomingMessage, name: string | undefined, deps: WhatsAppDeps) {
  const now = deps.now();
  const text = msg.type === 'text' ? String(msg.text?.body ?? '').slice(0, 2000) : `[${msg.type}]`;
  const requestId = text.toUpperCase().match(/DY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}/)?.[0];

  let conv = await deps.store.upsert(
    msg.from,
    (c) => {
      if (name) c.name = name;
      c.lastInboundAt = now.toISOString();
      c.messages.push({ id: msg.id, at: now.toISOString(), direction: 'in', author: 'kunde', text });
      if (/^\s*start\s*$/i.test(text)) c.optedOut = false;
    },
    now,
    deps.retentionDays,
  );

  // Anfrage-ID im Text → mit dem Vorgang verknüpfen
  if (requestId && REQUEST_ID_PATTERN.test(requestId) && (await deps.requests.get(requestId))) {
    await deps.requests.update(requestId, (r) => logNote(r, 'whatsapp', 'WhatsApp-Nachricht des Kunden eingegangen (siehe WhatsApp-Postfach)', now));
    conv = await deps.store.upsert(msg.from, (c) => (c.linkedRequestId = requestId), now, deps.retentionDays);
  }

  let reply: string | undefined;
  if (OPT_OUT_PATTERN.test(text)) {
    conv = await deps.store.upsert(msg.from, (c) => (c.optedOut = true), now, deps.retentionDays);
    reply = BOT_TEXTS.optOut;
  } else if (conv.optedOut || conv.needsHuman || !deps.autoReply) {
    return; // Mitarbeiter übernimmt bzw. keine automatischen Antworten gewünscht
  } else if (msg.type !== 'text') {
    reply = BOT_TEXTS.nonText;
    conv = await deps.store.upsert(msg.from, (c) => (c.needsHuman = true), now, deps.retentionDays);
  } else if (HANDOVER_PATTERN.test(text)) {
    reply = BOT_TEXTS.handover;
    conv = await deps.store.upsert(msg.from, (c) => (c.needsHuman = true), now, deps.retentionDays);
  } else if (!deps.assistant.configured) {
    reply = BOT_TEXTS.notConfigured;
    conv = await deps.store.upsert(msg.from, (c) => (c.needsHuman = true), now, deps.retentionDays);
  } else {
    const history: ChatTurn[] = conv.messages
      .filter((m) => m.status !== 'failed')
      .slice(-10)
      .map((m) => ({ role: m.direction === 'in' ? 'user' : 'assistant', text: m.text }));
    try {
      reply = await deps.assistant.chat(history);
    } catch {
      reply = BOT_TEXTS.handover;
      conv = await deps.store.upsert(msg.from, (c) => (c.needsHuman = true), now, deps.retentionDays);
    }
  }
  if (reply) await sendAndLog(msg.from, reply, 'bot', deps);
}

export async function sendAndLog(waId: string, text: string, author: string, deps: Pick<WhatsAppDeps, 'store' | 'sender' | 'now' | 'retentionDays'>) {
  const result = await deps.sender.sendText(waId, text);
  const now = deps.now();
  return deps.store.upsert(
    waId,
    (c) =>
      c.messages.push({
        id: result.id ?? `local-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        at: now.toISOString(),
        direction: 'out',
        author,
        text,
        status: result.ok ? 'sent' : 'failed',
        ...(result.error ? { error: result.error } : {}),
      }),
    now,
    deps.retentionDays,
  );
}

export function withinServiceWindow(conv: WaConversation, now: Date) {
  return !!conv.lastInboundAt && now.getTime() - new Date(conv.lastInboundAt).getTime() < SERVICE_WINDOW_MS;
}
