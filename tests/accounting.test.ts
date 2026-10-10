import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { AccountingStore, computeTotals } from '../server/accounting';
import { base32Decode, base32Encode, generateTotpSecret, totpCode, verifyTotp } from '../server/totp';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore } from '../server/store';
import { DemoOfferProvider } from '../server/offers';
import { DisabledNotifier } from '../server/notifier';
import { DisabledAssistant } from '../server/assistant';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';

const NOW = new Date('2026-10-10T10:00:00Z');
const ACTOR = 'admin:test';
const SETTINGS = { ownerName: 'Max Muster', taxNumber: '231/123/45678', email: 'info@daryos.test' };
const invoiceBody = (over: Record<string, unknown> = {}) => ({
  customer: { name: 'Erika Kunde', street: 'Hauptstr. 1', postalCode: '04109', city: 'Leipzig' },
  items: [{ description: 'Tarifberatung', quantity: 2, unitPriceCents: 5000, vatRate: 19 }],
  ...over,
});

test('TOTP: RFC-6238-Testvektor und Toleranzfenster', () => {
  // RFC 6238, Anhang B (SHA1, Secret "12345678901234567890"), T = 59 s → 94287082 (8 Stellen) → 6 Stellen: 287082
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(totpCode(secret, 59_000), '287082');
  assert.equal(base32Decode(secret).toString(), '12345678901234567890');
  const s = generateTotpSecret();
  const t = NOW.getTime();
  assert.ok(verifyTotp(s, totpCode(s, t), t));
  assert.ok(verifyTotp(s, totpCode(s, t - 30_000), t), '30 s Uhrabweichung erlaubt');
  assert.ok(!verifyTotp(s, totpCode(s, t - 120_000), t), 'alter Code abgelehnt');
  assert.ok(!verifyTotp(s, 'abcdef', t));
});

test('Rechnungssummen: USt je Satz, Kleinunternehmer ohne USt', () => {
  const items = [
    { description: 'a', quantity: 1, unitPriceCents: 10000, vatRate: 19 },
    { description: 'b', quantity: 3, unitPriceCents: 1000, vatRate: 7 },
  ];
  const t = computeTotals(items, false);
  assert.deepEqual(t.vatBreakdown, [{ rate: 7, netCents: 3000, vatCents: 210 }, { rate: 19, netCents: 10000, vatCents: 1900 }]);
  assert.equal(t.grossCents, 15110);
  assert.equal(computeTotals(items, true).vatCents, 0);
});

test('Rechnungen: erst mit Firmendaten, fortlaufende Nummern, Kleinunternehmer-Standard', async () => {
  const a = await AccountingStore.open(undefined, () => NOW);
  await assert.rejects(a.createInvoice(invoiceBody(), ACTOR), /Firmendaten/);
  await a.updateSettings(SETTINGS);
  const r1 = await a.createInvoice(invoiceBody(), ACTOR);
  const r2 = await a.createInvoice(invoiceBody(), ACTOR);
  assert.equal(r1.number, 'RE-2026-0001');
  assert.equal(r2.number, 'RE-2026-0002');
  assert.equal(r1.smallBusiness, true);
  assert.equal(r1.vatCents, 0);
  assert.equal(r1.grossCents, 10000);
  assert.equal(r1.dueDate, '2026-10-24');
  assert.equal(r1.seller.taxNumber, SETTINGS.taxNumber, 'Firmendaten werden in der Rechnung eingefroren');
  await assert.rejects(a.createInvoice(invoiceBody({ items: [] }), ACTOR), /prüfen/);
  await assert.rejects(a.createInvoice(invoiceBody({ customer: { name: 'X' } }), ACTOR), /prüfen/);
});

test('Bezahlt → Einnahme-Buchung; Storno → Stornorechnung + Gegenbuchung, nichts gelöscht', async () => {
  const a = await AccountingStore.open(undefined, () => NOW);
  await a.updateSettings({ ...SETTINGS, smallBusiness: false });
  const inv = await a.createInvoice(invoiceBody(), ACTOR);
  assert.equal(inv.grossCents, 11900);
  await a.markPaid(inv.id, '2026-10-09', ACTOR);
  await assert.rejects(a.markPaid(inv.id, undefined, ACTOR), /offene/);
  assert.equal(a.summary('2026').incomeCents, 11900);
  assert.equal(a.summary('2026').vatCollectedCents, 1900);

  await assert.rejects(a.cancelInvoice(inv.id, '', ACTOR), /Stornogrund/);
  const { invoice, storno } = await a.cancelInvoice(inv.id, 'Doppelt berechnet', ACTOR);
  assert.equal(invoice.status, 'storniert');
  assert.equal(storno.number, 'RE-2026-0002');
  assert.equal(storno.grossCents, -11900);
  assert.equal(a.listInvoices().length, 2, 'Originalrechnung bleibt erhalten');
  assert.equal(a.summary('2026').incomeCents, 0, 'Gegenbuchung gleicht aus');
  await assert.rejects(a.cancelInvoice(inv.id, 'nochmal', ACTOR), /nicht storniert/);
});

test('Buchungen: Validierung, Gegenbuchung statt Löschen, Auswertung und CSV', async () => {
  const a = await AccountingStore.open(undefined, () => NOW);
  await assert.rejects(a.addBooking({ type: 'ausgabe', date: '2026-12-01', category: 'Werbung', description: 'x', grossCents: 100 }, ACTOR), /prüfen/);
  await assert.rejects(a.addBooking({ type: 'ausgabe', date: '2026-10-01', category: 'Provision', description: 'x', grossCents: 100 }, ACTOR), /prüfen/);
  const b = await a.addBooking({ type: 'ausgabe', date: '2026-10-01', category: 'Werbung', description: 'Flyer', grossCents: 11900, vatRate: 19, receiptNo: 'B-1' }, ACTOR);
  await a.addBooking({ type: 'einnahme', date: '2026-09-15', category: 'Provision', description: 'Provision Strom', grossCents: 8000, vatRate: 0 }, ACTOR);
  let s = a.summary('2026');
  assert.equal(s.expenseCents, 11900);
  assert.equal(s.resultCents, -3900);
  assert.equal(s.months[9].expenseCents, 11900);
  assert.equal(s.expensesByCategory[0].category, 'Werbung');

  const rev = await a.reverseBooking(b.id, ACTOR);
  assert.equal(rev.grossCents, -11900);
  await assert.rejects(a.reverseBooking(b.id, ACTOR), /bereits/);
  s = a.summary('2026');
  assert.equal(s.expenseCents, 0);
  assert.equal(a.listBookings('2026').length, 3);

  const csv = a.bookingsCsv('2026');
  assert.match(csv, /^﻿Datum;Art;Kategorie/);
  assert.match(csv, /2026-10-01;Ausgabe;"Werbung";"Flyer";119,00;19;19,00;"B-1"/);
});

test('API: Buchhaltung nur angemeldet; 2FA verlangt Passwort UND Code', async () => {
  const totpSecret = generateTotpSecret();
  const accounting = await AccountingStore.open(undefined, () => NOW);
  const deps: AppDeps = {
    store: new MemoryRequestStore(),
    offerProvider: new DemoOfferProvider(),
    notifier: new DisabledNotifier(),
    assistant: new DisabledAssistant(),
    sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567'), totpSecret },
    accounting,
    secureCookies: false,
    now: () => NOW,
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

  assert.deepEqual((await call('GET', '/admin/auth-config')).json, { configured: true, twoFactor: true });
  assert.equal((await call('GET', '/admin/accounting/invoices')).status, 401);
  assert.equal((await call('POST', '/admin/login', { password: 'passwort-1234567' })).status, 401, 'ohne Code');
  assert.equal((await call('POST', '/admin/login', { password: 'passwort-1234567', code: '000000' })).status, 401, 'falscher Code');
  assert.equal((await call('POST', '/admin/login', { password: 'falsch', code: totpCode(totpSecret, NOW.getTime()) })).status, 401, 'falsches Passwort');
  const login = await call('POST', '/admin/login', { password: 'passwort-1234567', code: totpCode(totpSecret, NOW.getTime()) });
  assert.equal(login.status, 200);
  const c = login.cookie!;

  assert.equal((await call('POST', '/admin/accounting/invoices', invoiceBody(), c)).status, 409, 'Firmendaten fehlen');
  const bad = await call('PUT', '/admin/accounting/settings', { postalCode: '12' }, c);
  assert.equal(bad.status, 400);
  assert.ok(bad.json.fields.postalCode);
  assert.equal((await call('PUT', '/admin/accounting/settings', SETTINGS, c)).json.missing.length, 0);
  const inv = await call('POST', '/admin/accounting/invoices', invoiceBody(), c);
  assert.equal(inv.status, 201);
  assert.equal((await call('POST', `/admin/accounting/invoices/${inv.json.invoice.id}/paid`, {}, c)).json.invoice.status, 'bezahlt');
  const ov = await call('GET', '/admin/overview', undefined, c);
  assert.equal(ov.json.accounting.incomeCents, 10000);
  const csv = await fetch(`${base}/admin/accounting/export.csv?year=2026`, { headers: { cookie: c } });
  assert.match(csv.headers.get('content-disposition') ?? '', /Daryos-Buchungen-2026\.csv/);
  server.close();
});
