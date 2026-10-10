import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore, type NotificationLog, type RequestRecord } from '../server/store';
import { DemoOfferProvider } from '../server/offers';
import { DisabledAssistant } from '../server/assistant';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';
import { CustomerAuth } from '../server/customers';
import { detectUploadType, MemoryFileStorage, safeFileName } from '../server/files';
import type { Notifier } from '../server/notifier';

class MailBox implements Notifier {
  readonly configured = true;
  readonly detail = 'Test';
  mails: { to: string; text: string }[] = [];
  async notifyAdminNewRequest(): Promise<NotificationLog> {
    return { at: '', channel: 'email', recipient: 'admin', status: 'sent', detail: '' };
  }
  async sendCustomerEmail(to: string, _s: string, text: string): Promise<NotificationLog> {
    this.mails.push({ to, text });
    return { at: '', channel: 'email', recipient: 'customer', status: 'sent', detail: '' };
  }
}

const record = (id: string, email: string): RequestRecord => ({
  id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'WAITING_FOR_ADMIN', history: [],
  input: { energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3000 } as any, comparison: null,
  contact: { name: 'Kunde', email, consentAt: new Date().toISOString() } as any, drafts: [], notifications: [], deleteAfter: '2099-01-01T00:00:00Z',
});
const PDF = Buffer.from('%PDF-1.4\n%Test\n');

async function start() {
  const store = new MemoryRequestStore();
  await store.create(record('DY-AAAA-BBBB-CCCC', 'Kunde@Example.de'));
  await store.create(record('DY-DDDD-EEEE-FFFF', 'fremd@example.de'));
  const mail = new MailBox();
  const files = new MemoryFileStorage();
  const deps: AppDeps = {
    store, offerProvider: new DemoOfferProvider(), notifier: mail, assistant: new DisabledAssistant(), sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567') },
    secureCookies: false, appUrl: 'https://daryos.test', files, customers: new CustomerAuth(),
    limits: { compare: new RateLimiter(99, 60_000), contact: new RateLimiter(99, 60_000), login: new RateLimiter(99, 60_000), assistant: new RateLimiter(99, 60_000), status: new RateLimiter(99, 60_000) },
  };
  const app = express();
  app.use('/api', createApp(deps));
  const server: Server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const call = async (method: string, path: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}) => {
    const raw = Buffer.isBuffer(body);
    const res = await fetch(base + path, { method, headers: { ...(raw ? {} : { 'content-type': 'application/json' }), ...headers, ...(cookie ? { cookie } : {}) }, body: (body === undefined ? undefined : raw ? new Uint8Array(body as Buffer) : JSON.stringify(body)) as BodyInit | undefined });
    const buf = Buffer.from(await res.arrayBuffer());
    let json: any = null;
    try { json = JSON.parse(buf.toString()); } catch { /* Datei */ }
    return { status: res.status, json, buf, headers: res.headers, cookie: res.headers.get('set-cookie')?.split(';')[0] };
  };
  return { server, call, mail, files, store };
}

test('Dateiprüfung: Typ am Inhalt erkannt, Dateinamen bereinigt', () => {
  assert.equal(detectUploadType(PDF), 'application/pdf');
  assert.equal(detectUploadType(Buffer.from('<html>')), undefined);
  assert.equal(safeFileName(encodeURIComponent('../../etc/Rechnung 2025.pdf'), 'application/pdf'), 'Rechnung 2025.pdf');
  assert.equal(safeFileName('bild.exe', 'image/png'), 'bild.png');
});

test('Kundenkonto: Login-Link nur bei vorhandener Anfrage, einmalig, nur eigene Anfragen und Dateien', async () => {
  const { server, call, mail, files } = await start();
  try {
    assert.equal((await call('GET', '/customer/me')).status, 401);
    // Unbekannte Adresse: gleiche Antwort, aber keine E-Mail
    const unknown = await call('POST', '/customer/login', { email: 'niemand@example.de' });
    assert.equal(unknown.status, 200);
    assert.equal(mail.mails.length, 0);
    await call('POST', '/customer/login', { email: 'kunde@example.de' });
    assert.equal(mail.mails.length, 1);
    const token = mail.mails[0].text.match(/#\/konto\/anmelden\/([\w-]+)/)![1];
    const v = await call('POST', '/customer/verify', { token });
    assert.equal(v.status, 200);
    assert.equal((await call('POST', '/customer/verify', { token })).status, 401, 'Link nur einmal gültig');
    const c = v.cookie!;

    const me = await call('GET', '/customer/me', undefined, c);
    assert.deepEqual(me.json.requests.map((r: any) => r.requestId), ['DY-AAAA-BBBB-CCCC']);
    assert.equal(me.json.requests[0].contact, undefined, 'keine internen Daten');

    // Hochladen: nur echte PDFs/Bilder, nur eigene Anfrage
    assert.equal((await call('POST', '/customer/requests/DY-AAAA-BBBB-CCCC/documents', Buffer.from('<script>'), c, { 'content-type': 'application/pdf' })).status, 415);
    assert.equal((await call('POST', '/customer/requests/DY-DDDD-EEEE-FFFF/documents', PDF, c, { 'content-type': 'application/pdf' })).status, 404);
    const up = await call('POST', '/customer/requests/DY-AAAA-BBBB-CCCC/documents', PDF, c, { 'content-type': 'application/pdf', 'x-file-name': encodeURIComponent('Jahresabrechnung.pdf') });
    assert.equal(up.status, 201);
    assert.equal(files.files.size, 1);
    const docId = up.json.document.id;
    const dl = await call('GET', `/customer/requests/DY-AAAA-BBBB-CCCC/documents/${docId}`, undefined, c);
    assert.ok(dl.buf.equals(PDF));
    assert.match(dl.headers.get('content-disposition')!, /attachment/);

    // Verwaltung sieht die Datei; Kunde darf löschen
    const admin = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;
    assert.ok((await call('GET', `/admin/requests/DY-AAAA-BBBB-CCCC/documents/${docId}`, undefined, admin)).buf.equals(PDF));
    assert.equal((await call('GET', `/admin/requests/DY-AAAA-BBBB-CCCC/documents/${docId}`, undefined, c)).status, 401, 'Kundensitzung ist keine Verwaltungssitzung');
    assert.equal((await call('DELETE', `/customer/requests/DY-AAAA-BBBB-CCCC/documents/${docId}`, undefined, c)).status, 200);
    assert.equal(files.files.size, 0);

    await call('POST', '/customer/logout', {}, c);
    assert.equal((await call('GET', '/customer/me', undefined, c)).status, 401);
  } finally {
    server.close();
  }
});
