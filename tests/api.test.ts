import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore } from '../server/store';
import { DemoOfferProvider, UnconfiguredOfferProvider, type OfferProvider } from '../server/offers';
import { DisabledNotifier } from '../server/notifier';
import { DisabledAssistant } from '../server/assistant';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';

const PASSWORD = 'test-passwort-1234';
const passwordHash = hashPassword(PASSWORD);
const generousLimits = () => ({
  compare: new RateLimiter(1000, 60_000), contact: new RateLimiter(1000, 60_000), login: new RateLimiter(1000, 60_000),
  assistant: new RateLimiter(1000, 60_000), status: new RateLimiter(1000, 60_000),
});

async function startServer(overrides: Partial<AppDeps> = {}) {
  const deps: AppDeps = {
    store: new MemoryRequestStore(),
    offerProvider: new DemoOfferProvider(),
    notifier: new DisabledNotifier(),
    assistant: new DisabledAssistant(),
    sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash },
    secureCookies: false,
    offerTimeoutMs: 200,
    limits: generousLimits(),
    ...overrides,
  };
  const app = express();
  app.use('/api', createApp(deps));
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as { port: number };
  const base = `http://127.0.0.1:${port}/api`;
  const call = async (method: string, path: string, body?: unknown, cookie?: string) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as any;
    return { status: res.status, json, setCookie: res.headers.get('set-cookie') };
  };
  return { server, call, deps };
}

let ctx: Awaited<ReturnType<typeof startServer>>;
before(async () => {
  ctx = await startServer();
});
after(() => ctx.server.close());

const gas = { energyType: 'gas', postalCode: '04109', annualConsumptionKwh: 12000 };
const contactFor = (offerId: string, email = 'kunde@example.de') => ({ offerId, name: 'Erika Muster', email, consentPrivacy: true });

async function login() {
  const r = await ctx.call('POST', '/admin/login', { password: PASSWORD });
  assert.equal(r.status, 200);
  return r.setCookie!.split(';')[0];
}

test('Erfolgsfall: Vergleich → Kontaktanfrage → Admin-Freigabe → Einreichung → Abschluss', async () => {
  const cmp = await ctx.call('POST', '/compare', gas);
  assert.equal(cmp.status, 200);
  assert.equal(cmp.json.status, 'OFFERS_FOUND');
  assert.equal(cmp.json.comparison.isDemo, true);
  const offerId = cmp.json.comparison.offers[0].offer.id;
  const id = cmp.json.requestId;

  const contact = await ctx.call('POST', `/requests/${id}/contact`, contactFor(offerId));
  assert.equal(contact.status, 201);
  assert.equal(contact.json.status.status, 'WAITING_FOR_ADMIN');

  const cookie = await login();
  const detail = await ctx.call('GET', `/admin/requests/${id}`, undefined, cookie);
  assert.equal(detail.json.request.summary.generatedBy, 'system');
  assert.ok(detail.json.request.summary.warnings.some((w: string) => w.includes('DEMO')));
  assert.equal(detail.json.request.notifications[0].status, 'not_configured', 'Keine vorgetäuschte E-Mail');

  assert.equal((await ctx.call('POST', `/admin/requests/${id}/action`, { action: 'complete', providerConfirmationRef: 'X' }, cookie)).status, 409, 'Kein Abschluss vor Freigabe');
  assert.equal((await ctx.call('POST', `/admin/requests/${id}/action`, { action: 'approve' }, cookie)).status, 200);
  assert.equal((await ctx.call('POST', `/admin/requests/${id}/action`, { action: 'submit' }, cookie)).status, 200);
  assert.equal((await ctx.call('POST', `/admin/requests/${id}/action`, { action: 'complete' }, cookie)).status, 400, 'Abschluss nur mit Bestätigungsreferenz');
  const done = await ctx.call('POST', `/admin/requests/${id}/action`, { action: 'complete', providerConfirmationRef: 'ANB-123' }, cookie);
  assert.equal(done.json.request.status, 'COMPLETED');
  const last = done.json.request.history.at(-1);
  assert.equal(last.actor, 'admin:inhaber@daryos.test');
  assert.match(last.note, /ANB-123.*DEMO/);

  const pub = await ctx.call('GET', `/requests/${id}`);
  assert.equal(pub.json.status, 'COMPLETED');
  assert.ok(!JSON.stringify(pub.json).includes('kunde@example.de'), 'Öffentlicher Status enthält keine Kontaktdaten');
});

test('Ungültige Eingaben werden mit Feldfehlern abgelehnt', async () => {
  const r = await ctx.call('POST', '/compare', { energyType: 'gas', postalCode: 'abc' });
  assert.equal(r.status, 400);
  assert.ok(r.json.fields.postalCode && r.json.fields.annualConsumptionKwh);
  const { port } = ctx.server.address() as { port: number };
  const bad = await fetch(`http://127.0.0.1:${port}/api/compare`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{kaputt',
  });
  assert.equal(bad.status, 400);
});

test('Kontaktanfrage: fremdes Angebot, fehlende Einwilligung, Honeypot und unbekannte ID', async () => {
  const cmp = await ctx.call('POST', '/compare', gas);
  const id = cmp.json.requestId;
  assert.equal((await ctx.call('POST', `/requests/${id}/contact`, contactFor('demo-strom-s1'))).status, 400);
  assert.equal((await ctx.call('POST', `/requests/${id}/contact`, { ...contactFor('demo-gas-g1'), consentPrivacy: false })).status, 400);
  assert.equal((await ctx.call('POST', `/requests/${id}/contact`, { ...contactFor('demo-gas-g1'), website: 'spam' })).status, 400);
  assert.equal((await ctx.call('GET', '/requests/DY-AAAA-BBBB-CCCC')).status, 404);
  assert.equal((await ctx.call('GET', '/requests/123')).status, 400);
});

test('Unvollständige Angebote sind sichtbar, aber nicht gerankt und ohne Kostenangabe', async () => {
  const cmp = await ctx.call('POST', '/compare', gas);
  const incomplete = cmp.json.comparison.offers.find((o: any) => !o.complete);
  assert.ok(incomplete);
  assert.equal(incomplete.cost, null);
  assert.equal(cmp.json.comparison.cheapestFlagValid, false);
});

test('Doppelte Anfragen werden erkannt und nicht erneut angelegt', async () => {
  const cmp = await ctx.call('POST', '/compare', gas);
  const id = cmp.json.requestId;
  const offerId = cmp.json.comparison.offers[1].offer.id;
  const first = await ctx.call('POST', `/requests/${id}/contact`, contactFor(offerId, 'doppelt@example.de'));
  assert.equal(first.status, 201);
  const again = await ctx.call('POST', `/requests/${id}/contact`, contactFor(offerId, 'doppelt@example.de'));
  assert.equal(again.status, 200);
  assert.equal(again.json.duplicate, true);

  // Neuer Vergleich, gleiches Angebot + gleiche E-Mail innerhalb von 30 Minuten → bestehende Anfrage
  const cmp2 = await ctx.call('POST', '/compare', gas);
  const cross = await ctx.call('POST', `/requests/${cmp2.json.requestId}/contact`, contactFor(offerId, 'doppelt@example.de'));
  assert.equal(cross.json.duplicate, true);
  assert.equal(cross.json.requestId, id);

  // Anderes Angebot nach bereits gesendeter Anfrage → Konflikt
  const other = await ctx.call('POST', `/requests/${id}/contact`, contactFor(cmp.json.comparison.offers[0].offer.id, 'doppelt@example.de'));
  assert.equal(other.status, 409);
});

test('API-Ausfall, Zeitüberschreitung, leeres Ergebnis und nicht eingerichtete Quelle', async () => {
  const down = await ctx.call('POST', '/compare', { ...gas, postalCode: '99999' });
  assert.equal(down.status, 502);
  assert.equal(down.json.status, 'ERROR');
  assert.equal(down.json.comparison.offers.length, 0);

  const empty = await ctx.call('POST', '/compare', { ...gas, postalCode: '00000' });
  assert.equal(empty.json.comparison.status, 'no_offers');

  const slow: OfferProvider = {
    info: { id: 'slow', name: 'Langsam', isDemo: true, configured: true },
    fetchOffers: () => new Promise(() => {}),
  };
  const s2 = await startServer({ offerProvider: slow, offerTimeoutMs: 50 });
  const t = await s2.call('POST', '/compare', gas);
  assert.equal(t.status, 502);
  assert.match(t.json.comparison.message, /nicht innerhalb/);
  s2.server.close();

  const s3 = await startServer({ offerProvider: new UnconfiguredOfferProvider('vergleichsportal', 'Zentrale Angebotsplattform') });
  const nc = await s3.call('POST', '/compare', gas);
  assert.equal(nc.json.comparison.status, 'provider_not_configured');
  assert.equal(nc.json.comparison.offers.length, 0, 'Keine erfundenen Angebote');
  s3.server.close();
});

test('Nicht autorisierte Zugriffe auf Admin-Endpunkte werden abgelehnt', async () => {
  assert.equal((await ctx.call('GET', '/admin/requests')).status, 401);
  assert.equal((await ctx.call('GET', '/admin/requests/x', undefined, 'daryos_admin=gefälscht')).status, 401);
  assert.equal((await ctx.call('POST', '/admin/requests/x/action', { action: 'approve' })).status, 401);
  assert.equal((await ctx.call('POST', '/admin/login', { password: '' })).status, 401);
  assert.equal((await ctx.call('POST', '/admin/login', { password: '04329' })).status, 401, 'Alte Standard-PINs funktionieren nicht mehr');

  const cookie = await login();
  assert.equal((await ctx.call('GET', '/admin/me', undefined, cookie)).status, 200);
  await ctx.call('POST', '/admin/logout', {}, cookie);
  assert.equal((await ctx.call('GET', '/admin/me', undefined, cookie)).status, 401, 'Sitzung nach Abmeldung ungültig');

  const noAdmin = await startServer({ admin: { email: 'a@b', name: 'A' } });
  assert.equal((await noAdmin.call('POST', '/admin/login', { password: PASSWORD })).status, 503);
  noAdmin.server.close();
});

test('Rate-Limit für Kontaktanfragen (Spamschutz)', async () => {
  const s = await startServer({ limits: { ...generousLimits(), contact: new RateLimiter(2, 60_000) } });
  const cmp = await s.call('POST', '/compare', gas);
  const codes = [];
  for (let i = 0; i < 3; i++) codes.push((await s.call('POST', `/requests/${cmp.json.requestId}/contact`, {})).status);
  assert.deepEqual(codes, [400, 400, 429]);
  s.server.close();
});

test('Fremde Herkunft (CSRF) und Rate-Limit beim Login', async () => {
  const { port } = ctx.server.address() as { port: number };
  const csrf = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://boese.example' }, body: JSON.stringify({ password: PASSWORD }),
  });
  assert.equal(csrf.status, 403);

  const limited = await startServer({
    limits: { ...generousLimits(), login: new RateLimiter(3, 60_000) },
  });
  for (let i = 0; i < 3; i++) await limited.call('POST', '/admin/login', { password: 'falsch' });
  assert.equal((await limited.call('POST', '/admin/login', { password: PASSWORD })).status, 429);
  limited.server.close();
});

test('KI-Assistent ohne Konfiguration gibt ehrlich "nicht eingerichtet" zurück; Entwurf als Vorlage', async () => {
  const cmp = await ctx.call('POST', '/compare', gas);
  const id = cmp.json.requestId;
  const a = await ctx.call('POST', `/requests/${id}/assistant`, { question: 'Welcher Tarif hat die längste Preisgarantie?' });
  assert.equal(a.status, 503);
  await ctx.call('POST', `/requests/${id}/contact`, contactFor(cmp.json.comparison.offers[0].offer.id, 'entwurf@example.de'));
  const cookie = await login();
  const d = await ctx.call('POST', `/admin/requests/${id}/draft`, {}, cookie);
  assert.equal(d.status, 201);
  assert.equal(d.json.draft.createdBy, 'system');
  assert.match(d.json.draft.body, /noch kein Vertragsabschluss/);
  assert.equal(d.json.request.notifications.length, 1, 'Entwurf wird nicht versendet');
});
