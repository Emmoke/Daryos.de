import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHmac } from 'node:crypto';
import type { Server } from 'node:http';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore } from '../server/store';
import { DemoOfferProvider } from '../server/offers';
import { DisabledNotifier } from '../server/notifier';
import { DisabledAssistant, type Assistant, type ChatTurn } from '../server/assistant';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';
import { BOT_TEXTS, ConversationStore, type WhatsAppConfig, type WhatsAppSender } from '../server/whatsapp';

const SECRET = 'app-secret-test';
const PASSWORD = 'test-passwort-1234';
const cfg: WhatsAppConfig = { accessToken: 't', phoneNumberId: '123', appSecret: SECRET, verifyToken: 'verify-me', graphVersion: 'v21.0', autoReply: true };

class FakeSender implements WhatsAppSender {
  sent: { to: string; text: string }[] = [];
  fail = false;
  async sendText(to: string, text: string) {
    this.sent.push({ to, text });
    return this.fail ? { ok: false, error: 'boom' } : { ok: true, id: `wamid.out.${this.sent.length}` };
  }
}

class FakeAssistant extends DisabledAssistant implements Assistant {
  override readonly configured = true;
  calls: ChatTurn[][] = [];
  async chat(history: ChatTurn[]) {
    this.calls.push(history);
    return 'Antwort aus der Wissensbasis';
  }
}

const limits = () => ({
  compare: new RateLimiter(1000, 60_000), contact: new RateLimiter(1000, 60_000), login: new RateLimiter(1000, 60_000),
  assistant: new RateLimiter(1000, 60_000), status: new RateLimiter(1000, 60_000), chat: new RateLimiter(1000, 60_000),
});

async function start(overrides: Partial<AppDeps> = {}, withWa = true) {
  const sender = new FakeSender();
  const waStore = await ConversationStore.open();
  const assistant = new FakeAssistant();
  const deps: AppDeps = {
    store: new MemoryRequestStore(),
    offerProvider: new DemoOfferProvider(),
    notifier: new DisabledNotifier(),
    assistant,
    sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword(PASSWORD) },
    secureCookies: false,
    limits: limits(),
    whatsapp: withWa ? { config: cfg, store: waStore, sender } : undefined,
    ...overrides,
  };
  const app = express();
  app.use('/api', createApp(deps));
  const server: Server = await new Promise((r) => {
    const s = app.listen(0, () => r(s));
  });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const call = async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* Text */ }
    return { status: res.status, json, text, setCookie: res.headers.get('set-cookie') };
  };
  return { server, call, sender, waStore, assistant, deps };
}

const payload = (id: string, text: string, from = '4917600000001', type = 'text') => ({
  object: 'whatsapp_business_account',
  entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name: 'Erika' } }], messages: [{ id, from, type, ...(type === 'text' ? { text: { body: text } } : {}) }] } }] }],
});
const sign = (raw: string) => 'sha256=' + createHmac('sha256', SECRET).update(raw).digest('hex');
async function post(ctx: Awaited<ReturnType<typeof start>>, body: unknown, signature?: string) {
  const raw = JSON.stringify(body);
  return ctx.call('POST', '/whatsapp/webhook', raw, { 'x-hub-signature-256': signature ?? sign(raw) });
}

test('Webhook-Verifizierung nur mit korrektem Verify-Token', async () => {
  const ctx = await start();
  const ok = await ctx.call('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345');
  assert.equal(ok.status, 200);
  assert.equal(ok.text, '12345');
  assert.equal((await ctx.call('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=falsch&hub.challenge=1')).status, 403);
  ctx.server.close();
});

test('Nachrichten ohne oder mit falscher Signatur werden abgelehnt', async () => {
  const ctx = await start();
  const body = payload('wamid.1', 'Hallo');
  assert.equal((await post(ctx, body, 'sha256=' + '0'.repeat(64))).status, 401);
  assert.equal((await ctx.call('POST', '/whatsapp/webhook', body)).status, 401);
  // Manipulierter Inhalt mit Signatur des Originals
  const raw = JSON.stringify(body);
  assert.equal((await ctx.call('POST', '/whatsapp/webhook', raw.replace('Hallo', 'Hack'), { 'x-hub-signature-256': sign(raw) })).status, 401);
  assert.equal(ctx.sender.sent.length, 0);
  assert.equal(ctx.waStore.list().length, 0);
  ctx.server.close();
});

test('Signierte Nachricht: Bot antwortet aus der Wissensbasis, Doppelzustellung wird ignoriert', async () => {
  const ctx = await start();
  const body = payload('wamid.2', 'Was kostet die Beratung?');
  const r = await post(ctx, body);
  assert.equal(r.status, 200);
  assert.equal(r.json.processed, 1);
  assert.deepEqual(ctx.sender.sent, [{ to: '4917600000001', text: 'Antwort aus der Wissensbasis' }]);
  assert.equal((await post(ctx, body)).json.processed, 0, 'gleiche Nachrichten-ID nicht doppelt verarbeiten');
  assert.equal(ctx.sender.sent.length, 1);
  const conv = ctx.waStore.get('4917600000001')!;
  assert.equal(conv.name, 'Erika');
  assert.deepEqual(conv.messages.map((m) => m.direction), ['in', 'out']);
  ctx.server.close();
});

test('Wunsch nach einem Menschen → Übergabe, danach keine Bot-Antworten mehr', async () => {
  const ctx = await start();
  await post(ctx, payload('wamid.3', 'Ich möchte bitte mit einem Mitarbeiter sprechen'));
  assert.equal(ctx.sender.sent[0].text, BOT_TEXTS.handover);
  assert.equal(ctx.waStore.get('4917600000001')!.needsHuman, true);
  await post(ctx, payload('wamid.4', 'Hallo?'));
  assert.equal(ctx.sender.sent.length, 1, 'Bot schweigt, Mitarbeiter übernimmt');
  assert.equal(ctx.assistant.calls.length, 0);
  ctx.server.close();
});

test('Opt-out per STOP und Dateien gehen an einen Menschen', async () => {
  const ctx = await start();
  await post(ctx, payload('wamid.5', 'STOP'));
  assert.equal(ctx.sender.sent[0].text, BOT_TEXTS.optOut);
  await post(ctx, payload('wamid.6', 'Noch eine Frage'));
  assert.equal(ctx.sender.sent.length, 1, 'nach Opt-out keine automatischen Nachrichten');

  await post(ctx, payload('wamid.7', '', '4917600000002', 'image'));
  assert.equal(ctx.sender.sent.at(-1)!.text, BOT_TEXTS.nonText);
  assert.equal(ctx.waStore.get('4917600000002')!.needsHuman, true);
  ctx.server.close();
});

test('Anfrage-ID in WhatsApp verknüpft die Unterhaltung mit dem Vorgang', async () => {
  const ctx = await start();
  const cmp = await ctx.call('POST', '/compare', { energyType: 'gas', postalCode: '04109', annualConsumptionKwh: 12000 });
  const id = cmp.json.requestId;
  await post(ctx, payload('wamid.8', `Frage zu meiner Anfrage ${id.toLowerCase()}`));
  assert.equal(ctx.waStore.get('4917600000001')!.linkedRequestId, id);
  const rec = await ctx.deps.store.get(id);
  assert.ok(rec!.history.some((h) => h.actor === 'whatsapp'));
  ctx.server.close();
});

test('Ohne KI-Schlüssel: ehrliche Eingangsbestätigung und Übergabe', async () => {
  const ctx = await start({ assistant: new DisabledAssistant() });
  await post(ctx, payload('wamid.9', 'Hallo'));
  assert.equal(ctx.sender.sent[0].text, BOT_TEXTS.notConfigured);
  assert.equal(ctx.waStore.get('4917600000001')!.needsHuman, true);
  ctx.server.close();
});

test('Admin-Postfach: nur angemeldet, Antwort nur im 24-Stunden-Fenster', async () => {
  let now = new Date('2026-10-10T10:00:00Z');
  const ctx = await start({ now: () => now });
  await post(ctx, payload('wamid.10', 'Mitarbeiter bitte'));
  assert.equal((await ctx.call('GET', '/admin/whatsapp/conversations')).status, 401);
  assert.equal((await ctx.call('POST', '/admin/whatsapp/conversations/4917600000001/reply', { text: 'x' })).status, 401);

  const login = await ctx.call('POST', '/admin/login', { password: PASSWORD });
  const cookie = login.setCookie!.split(';')[0];
  const list = await ctx.call('GET', '/admin/whatsapp/conversations', undefined, { cookie });
  assert.equal(list.json.conversations[0].needsHuman, true);
  const reply = await ctx.call('POST', '/admin/whatsapp/conversations/4917600000001/reply', { text: 'Guten Tag, hier ist Daryos.' }, { cookie });
  assert.equal(reply.status, 200);
  assert.equal(reply.json.conversation.messages.at(-1).author, 'admin:inhaber@daryos.test');

  ctx.sender.fail = true;
  const failed = await ctx.call('POST', '/admin/whatsapp/conversations/4917600000001/reply', { text: 'noch mal' }, { cookie });
  assert.equal(failed.status, 502, 'Versandfehler wird ehrlich gemeldet');
  ctx.sender.fail = false;

  now = new Date('2026-10-11T11:00:00Z'); // > 24 h nach letzter Kundennachricht
  const late = await ctx.call('POST', '/admin/whatsapp/conversations/4917600000001/reply', { text: 'Hallo' }, { cookie });
  assert.equal(late.status, 409);
  ctx.server.close();
});

test('Ohne Business-API-Konfiguration ist der Webhook deaktiviert', async () => {
  const ctx = await start({}, false);
  assert.equal((await ctx.call('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=1')).status, 404);
  assert.equal((await post(ctx, payload('wamid.11', 'Hallo'))).status, 404);
  ctx.server.close();
});

test('Webseiten-Chat: validiert Verlauf, antwortet über Assistent bzw. meldet "nicht eingerichtet"', async () => {
  const ctx = await start();
  assert.equal((await ctx.call('POST', '/chat', { messages: [] })).status, 400);
  assert.equal((await ctx.call('POST', '/chat', { messages: [{ role: 'system', text: 'x' }] })).status, 400);
  assert.equal((await ctx.call('POST', '/chat', { messages: [{ role: 'user', text: 'a'.repeat(1001) }] })).status, 400);
  const ok = await ctx.call('POST', '/chat', { messages: [{ role: 'user', text: 'Welche Unterlagen brauche ich?' }] });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.reply, 'Antwort aus der Wissensbasis');
  ctx.server.close();

  const off = await start({ assistant: new DisabledAssistant() });
  assert.equal((await off.call('POST', '/chat', { messages: [{ role: 'user', text: 'Hallo' }] })).status, 503);
  const integ = await off.call('GET', '/integrations');
  assert.equal(integ.json.chat.configured, false);
  assert.equal(integ.json.whatsapp.mode, 'business_api');
  off.server.close();
});
