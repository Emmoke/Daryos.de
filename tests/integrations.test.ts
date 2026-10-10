import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore } from '../server/store';
import { DemoOfferProvider } from '../server/offers';
import { DisabledAssistant } from '../server/assistant';
import { DisabledNotifier } from '../server/notifier';
import { MemoryBackend } from '../server/persistence';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';
import { encryptionKeyFromEnv, IntegrationStore } from '../server/integrations';
import { ConversationStore } from '../server/whatsapp';
import { totpCode } from '../server/totp';

const KEY = encryptionKeyFromEnv({ CONFIG_ENCRYPTION_KEY: 'test-schluessel-mit-genug-laenge' }, true)!;
const GEMINI = 'AIza' + 'x'.repeat(35);

test('Zugangsdaten: verschlüsselt gespeichert, mit falschem Schlüssel unlesbar, ohne Schlüssel kein Speichern', async () => {
  const backend = new MemoryBackend();
  const s = await IntegrationStore.open(backend, KEY);
  await s.update('gemini', { GEMINI_API_KEY: GEMINI }, [], 'a', new Date());
  const raw = JSON.stringify(await backend.loadAll('integration_settings'));
  assert.ok(!raw.includes(GEMINI), 'Klartext darf nicht in der Datenbank stehen');
  assert.equal((await IntegrationStore.open(backend, KEY)).get('GEMINI_API_KEY'), GEMINI);
  assert.equal((await IntegrationStore.open(backend, encryptionKeyFromEnv({ CONFIG_ENCRYPTION_KEY: 'ein-ganz-anderer-schluessel' }, true))).get('GEMINI_API_KEY'), undefined);
  assert.equal(encryptionKeyFromEnv({}, true), undefined, 'im Produktivbetrieb kein Ersatzschlüssel');
  const ro = await IntegrationStore.open(backend, undefined);
  await assert.rejects(ro.update('gemini', { GEMINI_API_KEY: GEMINI }, [], 'a', new Date()), (e: any) => e.status === 503);
  await assert.rejects(s.update('gemini', { GEMINI_API_KEY: 'falsch' }, [], 'a', new Date()), (e: any) => !!e.fields.GEMINI_API_KEY);
  // Neues Google-Format (AQ.…) wird angenommen
  const fresh = await IntegrationStore.open(new MemoryBackend(), KEY);
  await fresh.update('gemini', { GEMINI_API_KEY: 'AQ.' + 'Ab9_x-'.repeat(8) }, [], 'a', new Date());
  assert.ok(fresh.get('GEMINI_API_KEY')?.startsWith('AQ.'));
  // Vorrang vor Server-Variablen; leeres Geheimnis = unverändert
  assert.equal(s.merged({ GEMINI_API_KEY: 'server' }).GEMINI_API_KEY, GEMINI);
  await s.update('gemini', { GEMINI_API_KEY: '' }, [], 'a', new Date());
  assert.equal(s.get('GEMINI_API_KEY'), GEMINI);
  assert.equal(s.describe('gemini', {})[0].display, `•••• ${GEMINI.slice(-4)}`);
});

async function startApp() {
  const backend = new MemoryBackend();
  const integrations = await IntegrationStore.open(backend, KEY);
  const deps: AppDeps = {
    store: new MemoryRequestStore(),
    offerProvider: new DemoOfferProvider(),
    notifier: new DisabledNotifier(),
    assistant: new DisabledAssistant(),
    sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567') },
    secureCookies: false,
    appUrl: 'https://daryos.test',
    integrations: { store: integrations, baseEnv: {}, conversations: await ConversationStore.open(backend) },
    limits: { compare: new RateLimiter(99, 60_000), contact: new RateLimiter(99, 60_000), login: new RateLimiter(99, 60_000), assistant: new RateLimiter(99, 60_000), status: new RateLimiter(99, 60_000) },
  };
  const app = express();
  app.use('/api', createApp(deps));
  const server: Server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const call = async (method: string, path: string, body?: unknown, cookie?: string) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, json: await res.json().catch(() => null), text: '', cookie: res.headers.get('set-cookie')?.split(';')[0] };
  };
  return { deps, server, call };
}

test('Verbindungen in der Verwaltung: nur angemeldet + Passwort, sofort aktiv, Schlüssel nie zurückgegeben', async () => {
  const { deps, server, call } = await startApp();
  try {
    assert.equal((await call('GET', '/admin/connections')).status, 401);
    const c = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;
    assert.equal((await call('GET', '/admin/connections', undefined, c)).json.status.gemini.configured, false);

    assert.equal((await call('PUT', '/admin/connections/gemini', { values: { GEMINI_API_KEY: GEMINI } }, c)).status, 403, 'ohne Passwort');
    assert.equal((await call('PUT', '/admin/connections/gemini', { values: { GEMINI_API_KEY: GEMINI }, password: 'falsch' }, c)).status, 403);
    const ok = await call('PUT', '/admin/connections/gemini', { values: { GEMINI_API_KEY: GEMINI }, password: 'passwort-1234567' }, c);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.status.gemini.configured, true, 'ohne Neustart aktiv');
    assert.equal(deps.assistant.configured, true);
    assert.ok(!JSON.stringify(ok.json).includes(GEMINI), 'Schlüssel wird nicht zurückgegeben');

    // E-Mail einrichten → Notifier wird ersetzt; WhatsApp-Bot → Webhook aktiv
    const mail = await call('PUT', '/admin/connections/email', { values: { SMTP_HOST: 'smtp-relay.brevo.com', SMTP_PASS: 'geheim', MAIL_FROM: 'info@daryos.de', ADMIN_NOTIFY_EMAIL: 'inhaber@daryos.test' }, password: 'passwort-1234567' }, c);
    assert.equal(mail.json.status.email.configured, true);
    assert.ok(!JSON.stringify(mail.json).includes('geheim'));
    assert.equal((await call('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1')).status, 404);
    await call('PUT', '/admin/connections/whatsapp', { values: { WHATSAPP_ACCESS_TOKEN: 'tok', WHATSAPP_PHONE_NUMBER_ID: '12345', WHATSAPP_APP_SECRET: 'app', WHATSAPP_VERIFY_TOKEN: 'verify-token-1234567' }, password: 'passwort-1234567' }, c);
    assert.equal((await call('GET', '/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-token-1234567&hub.challenge=1')).status, 200);

    // Entfernen → zurück auf Server-Variablen (hier: keine)
    const cleared = await call('PUT', '/admin/connections/gemini', { clear: ['GEMINI_API_KEY'], password: 'passwort-1234567' }, c);
    assert.equal(cleared.json.status.gemini.configured, false);
  } finally {
    server.close();
  }
});

test('Zwei-Faktor in der Verwaltung: Einrichtung nur mit Passwort und gültigem Code, danach Pflicht beim Login', async () => {
  const { deps, server, call } = await startApp();
  try {
    const c = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;
    assert.equal((await call('POST', '/admin/2fa/setup', { password: 'falsch' }, c)).status, 403);
    const { secret } = (await call('POST', '/admin/2fa/setup', { password: 'passwort-1234567' }, c)).json;
    assert.equal((await call('POST', '/admin/2fa/enable', { code: '000000' }, c)).status, 400);
    assert.equal((await call('POST', '/admin/2fa/enable', { code: totpCode(secret, Date.now()) }, c)).status, 200);
    assert.equal(deps.admin.totpSecret, secret);
    assert.equal((await call('POST', '/admin/login', { password: 'passwort-1234567' })).status, 401, 'Code jetzt Pflicht');
    assert.equal((await call('POST', '/admin/login', { password: 'passwort-1234567', code: totpCode(secret, Date.now()) })).status, 200);
    assert.equal((await call('POST', '/admin/2fa/disable', { password: 'passwort-1234567', code: '000000' }, c)).status, 403);
    assert.equal((await call('POST', '/admin/2fa/disable', { password: 'passwort-1234567', code: totpCode(secret, Date.now()) }, c)).json.twoFactor, false);
  } finally {
    server.close();
  }
});
