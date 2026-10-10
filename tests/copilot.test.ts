import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { buildBriefing, buildCopilotContext, CopilotStore, type CopilotInput } from '../server/copilot';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore, type RequestRecord } from '../server/store';
import { DemoOfferProvider } from '../server/offers';
import { DisabledAssistant } from '../server/assistant';
import { DisabledNotifier } from '../server/notifier';
import { MemoryBackend } from '../server/persistence';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';

const NOW = new Date('2026-10-10T09:00:00Z');
const rec = (id: string, over: Partial<RequestRecord> = {}): RequestRecord => ({
  id, createdAt: '2026-10-08T10:00:00Z', updatedAt: '2026-10-08T10:00:00Z', status: 'WAITING_FOR_ADMIN', history: [],
  input: { energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3200 } as any, comparison: null,
  contact: { name: 'Erika Mustermann', email: 'erika@example.de', phone: '0176 1234567', consentAt: '2026-10-08T10:00:00Z' } as any,
  summary: { generatedAt: '', generatedBy: 'system', text: '', missingInformation: ['Zählernummer'], warnings: [] },
  drafts: [], notifications: [], deleteAfter: '2099-01-01', ...over,
});
const input = (over: Partial<CopilotInput> = {}): CopilotInput => ({
  now: NOW, requests: [], tariffs: [], invoices: [], settingsMissing: [],
  whatsapp: { configured: false, needsHuman: 0, conversations: 0 }, connections: { gemini: true, email: true }, ...over,
});

test('Lagebild: neue, wartende, nachzufassende Anfragen, Tarife und Verbindungen', () => {
  const items = buildBriefing(input({
    since: '2026-10-09T00:00:00Z',
    requests: [
      rec('DY-AAAA-AAAA-AAAA'),
      rec('DY-BBBB-BBBB-BBBB', { createdAt: '2026-10-09T12:00:00Z', updatedAt: '2026-10-10T08:30:00Z' }),
      rec('DY-CCCC-CCCC-CCCC', { status: 'APPROVED', drafts: [{ id: 'd', createdAt: '', createdBy: 'system', kind: 'email_to_customer', subject: '', body: '', sentAt: '2026-10-05T10:00:00Z' }] }),
    ],
    connections: { gemini: true, email: false },
  }));
  const text = items.map((i) => i.text).join('\n');
  assert.match(text, /1 neue Kundenanfrage.*DY-BBBB/);
  assert.match(text, /seit über 24 Stunden.*DY-AAAA/);
  assert.match(text, /nachfassen: DY-CCCC/);
  assert.match(text, /Kein gültiger Tarif/);
  assert.match(text, /E-Mail ist nicht verbunden/);
  assert.equal(items[0].level, 'wichtig', 'Dringendes zuerst');
  assert.equal(items[0].href, '#/anfragen/DY-AAAA-AAAA-AAAA');
});

test('KI-Kontext enthält keine Namen, E-Mail-Adressen oder Telefonnummern', () => {
  const i = input({ requests: [rec('DY-AAAA-AAAA-AAAA')] });
  const ctx = buildCopilotContext(i, buildBriefing(i));
  assert.match(ctx, /DY-AAAA-AAAA-AAAA/);
  assert.match(ctx, /fehlt: Zählernummer/);
  assert.match(ctx, /PLZ 04…/);
  for (const pii of ['Erika', 'Mustermann', 'erika@example.de', '1234567', '04109']) assert.ok(!ctx.includes(pii), pii);
});

test('Verwaltungs-Assistent: nur angemeldet, letzter Besuch wird gemerkt, Chat mit Kontext', async () => {
  const store = new MemoryRequestStore();
  await store.create(rec('DY-AAAA-AAAA-AAAA', { createdAt: new Date().toISOString() }));
  let prompt = '';
  class FakeAI extends DisabledAssistant {
    override readonly configured = true;
    override async adminChat(p: string) {
      prompt = p;
      return 'Bitte zuerst DY-AAAA-AAAA-AAAA prüfen.';
    }
  }
  const deps: AppDeps = {
    store, offerProvider: new DemoOfferProvider(), notifier: new DisabledNotifier(), assistant: new FakeAI(), sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567') }, secureCookies: false,
    copilot: await CopilotStore.open(new MemoryBackend()),
    limits: { compare: new RateLimiter(99, 60_000), contact: new RateLimiter(99, 60_000), login: new RateLimiter(99, 60_000), assistant: new RateLimiter(99, 60_000), status: new RateLimiter(99, 60_000) },
  };
  const app = express();
  app.use('/api', createApp(deps));
  const server: Server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const call = async (method: string, path: string, body?: unknown, cookie?: string) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, json: await res.json().catch(() => null), cookie: res.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    assert.equal((await call('GET', '/admin/copilot/briefing')).status, 401);
    assert.equal((await call('POST', '/admin/copilot/chat', { messages: [{ role: 'user', text: 'Hallo' }] })).status, 401);
    const c = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;
    const first = await call('GET', '/admin/copilot/briefing', undefined, c);
    assert.equal(first.json.since, null);
    await call('POST', '/admin/copilot/seen', {}, c);
    assert.ok((await call('GET', '/admin/copilot/briefing', undefined, c)).json.since, 'letzter Besuch gemerkt');

    const chat = await call('POST', '/admin/copilot/chat', { messages: [{ role: 'user', text: 'Was zuerst?' }] }, c);
    assert.equal(chat.status, 200);
    assert.match(chat.json.reply, /DY-AAAA/);
    assert.match(prompt, /Inhaber: Was zuerst\?/);
    assert.match(prompt, /DY-AAAA-AAAA-AAAA/);
    assert.ok(!prompt.includes('erika@example.de'));
    assert.equal((await call('POST', '/admin/copilot/chat', { messages: [] }, c)).status, 400);
  } finally {
    server.close();
  }
});

test('Assistent kennt die Einstellungen des Kunden-Chats und Problemfragen', () => {
  const i = input({ chatConfig: { extraInstructions: 'Kurz antworten.', knowledge: [{ question: 'Samstag geöffnet?', answer: 'Nach Vereinbarung.' }], tools: { booking: true }, storeTranscripts: true }, chatProblems: ['Kann ich auch Internet wechseln?'] });
  const ctx = buildCopilotContext(i, buildBriefing(i));
  assert.match(ctx, /Kurz antworten/);
  assert.match(ctx, /Samstag geöffnet/);
  assert.match(ctx, /Internet wechseln/);
});
