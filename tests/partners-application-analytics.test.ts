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
import { MemoryFileStorage } from '../server/files';
import { PartnerStore, fillCustomerLink } from '../server/partners';
import { AnalyticsStore } from '../server/analytics';
import { checkApplication, parseExtraction, prefillFromRequest, validMaLo } from '../server/application';
import { MemoryBackend } from '../server/persistence';
import type { Notifier } from '../server/notifier';

const NOW = new Date('2026-10-10T10:00:00Z');
const realOffer = { id: 'kat-1', providerName: 'Stadtwerke Muster', tariffName: 'Strom Fix 12', workPriceCtPerKwh: 27.9, basePriceEurPerMonth: 11, source: { isDemo: false } };
const rec = (over: Partial<RequestRecord> = {}): RequestRecord => ({
  id: 'DY-AAAA-BBBB-CCCC', createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(), status: 'WAITING_FOR_ADMIN', history: [],
  input: { energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3200 } as any,
  comparison: { offers: [{ offer: realOffer }] } as any, selectedOfferId: 'kat-1',
  contact: { name: 'Erika Maria Mustermann', email: 'erika@example.de', consentAt: NOW.toISOString() } as any,
  drafts: [], notifications: [], deleteAfter: '2099-01-01', ...over,
});

test('Antragsprüfung: Pflichtfelder, MaLo-Prüfziffer, Volljährigkeit, Lieferbeginn, DEMO', () => {
  assert.ok(validMaLo('41373559241'));
  assert.ok(!validMaLo('41373559242'));
  const pre = prefillFromRequest(rec());
  assert.equal(pre.vorname, 'Erika Maria');
  assert.equal(pre.nachname, 'Mustermann');
  assert.equal(pre.anbieter, 'Stadtwerke Muster');
  const checks = checkApplication({ ...pre, geburtsdatum: '2015-01-01', marktlokation: '12345678901', lieferbeginn: '2026-01-01' }, rec(), NOW);
  const msgs = checks.map((c) => c.message).join(' | ');
  assert.match(msgs, /Zählernummer fehlt/);
  assert.match(msgs, /volljährig/);
  assert.match(msgs, /Marktlokations-ID ungültig/);
  assert.match(msgs, /Vergangenheit/);
  const demo = rec({ comparison: { offers: [{ offer: { ...realOffer, source: { isDemo: true } } }] } as any });
  assert.ok(checkApplication({}, demo, NOW).some((c) => /DEMO/.test(c.message)));
  assert.deepEqual(parseExtraction('```json\n{"zaehlernummer":"1ESY123","marktlokation":"","unbekannt":"x","jahresverbrauch":3100}\n```'), { zaehlernummer: '1ESY123', jahresverbrauch: '3100' });
});

test('Partner: Validierung, Kunden-Link nur mit Ziffern', async () => {
  const p = await PartnerStore.open();
  await assert.rejects(p.create({ name: 'X', kind: 'falsch', energyTypes: [], portalUrl: 'http://unsicher' }, 'a'), (e: any) => !!(e.fields.kind && e.fields.portalUrl && e.fields.energyTypes));
  const created = await p.create({ name: 'Maklerpool Test', kind: 'maklerpool', energyTypes: ['strom'], portalUrl: 'https://portal.example' }, 'a');
  assert.equal(p.list()[0].id, created.id);
  assert.equal(fillCustomerLink('https://x.de/?plz={plz}&kwh={kwh}', '04<script>109', 3200.4), 'https://x.de/?plz=04109&kwh=3200');
});

test('Auswertung: zählt ohne Personenbezug, erkennt Regionen ohne echten Tarif', async () => {
  const backend = new MemoryBackend();
  const a = await AnalyticsStore.open(backend, () => NOW);
  await a.recordComparison({ energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3200 } as any, 0);
  await a.recordComparison({ energyType: 'strom', postalCode: '04229', annualConsumptionKwh: 1200 } as any, 2);
  await a.recordContact('Stadtwerke Muster – Strom Fix 12');
  await a.recordEvent({ type: 'visit', route: 'start', referrer: 'google.com', device: 'mobil' });
  const s = a.summary(30);
  assert.equal(s.totals.comparisons, 2);
  assert.equal(s.totals.contacts, 1);
  assert.equal(s.totals.conversion, 50);
  assert.deepEqual(s.noRealOffer, [{ key: '04 (Strom)', count: 1 }]);
  assert.match(s.insights.join(' '), /PLZ 04 \(Strom\)/);
  const raw = JSON.stringify(await backend.loadAll('analytics_daily'));
  assert.ok(!raw.includes('04109'), 'keine vollständige PLZ gespeichert');
  assert.equal((await AnalyticsStore.open(backend, () => NOW)).summary(30).totals.comparisons, 2, 'dauerhaft gespeichert');
});

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

test('Antrag: Verwaltung bittet um Daten, Kunde ergänzt in „Mein Konto“, Einreichen mit Vorgangsnummer; Ereignisse nur mit Einwilligung', async () => {
  const store = new MemoryRequestStore();
  await store.create(rec());
  const mail = new MailBox();
  const partners = await PartnerStore.open();
  const partner = await partners.create({ name: 'Maklerpool Test', kind: 'maklerpool', energyTypes: ['strom'], portalUrl: 'https://portal.example' }, 'a');
  const analytics = await AnalyticsStore.open();
  const deps: AppDeps = {
    store, offerProvider: new DemoOfferProvider(), notifier: mail, assistant: new DisabledAssistant(), sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567') }, secureCookies: false, appUrl: 'https://daryos.test',
    files: new MemoryFileStorage(), customers: new CustomerAuth(), partners, analytics,
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
    const admin = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;
    const id = 'DY-AAAA-BBBB-CCCC';
    const pre = (await call('POST', `/admin/requests/${id}/application/prefill`, {}, admin)).json.suggestions;
    const saved = await call('PUT', `/admin/requests/${id}/application`, { partnerId: partner.id, fields: { ...pre, unbekannt: 'x' } }, admin);
    assert.equal(saved.json.request.application.status, 'entwurf');
    assert.equal(saved.json.request.application.fields.unbekannt, undefined);
    assert.equal(saved.json.request.application.partnerId, partner.id);

    assert.equal((await call('POST', `/admin/requests/${id}/application/request-data`, { confirm: true }, admin)).json.request.application.status, 'daten_angefordert');
    assert.match(mail.mails.at(-1)!.text, /#\/konto/);

    // Kunde meldet sich an und ergänzt – darf Tarif/Anbieter nicht ändern
    await call('POST', '/customer/login', { email: 'erika@example.de' });
    const token = mail.mails.at(-1)!.text.match(/#\/konto\/anmelden\/([\w-]+)/)![1];
    const c = (await call('POST', '/customer/verify', { token })).cookie!;
    const me = await call('GET', '/customer/me', undefined, c);
    assert.ok(me.json.requests[0].application.form.every((f: any) => f.key !== 'anbieter'));
    const part = await call('PUT', `/customer/requests/${id}/application`, { fields: { geburtsdatum: '1980-05-01' } }, c);
    assert.equal(part.json.status, 'daten_angefordert', 'noch unvollständig – Kunde kann weiter ergänzen');
    const done = await call('PUT', `/customer/requests/${id}/application`, { fields: { strasse: 'Musterweg', hausnummer: '1', ort: 'Leipzig', zaehlernummer: '1ESY1160123456', wechselgrund: 'wechsel', bisheriger_anbieter: 'Altversorger', anbieter: 'Gehackt' } }, c);
    assert.equal(done.json.status, 'vollstaendig');
    const after = (await call('GET', `/admin/requests/${id}`, undefined, admin)).json.request.application;
    assert.equal(after.fields.anbieter, 'Stadtwerke Muster');

    assert.equal((await call('POST', `/admin/requests/${id}/application/submitted`, {}, admin)).status, 400);
    const sub = await call('POST', `/admin/requests/${id}/application/submitted`, { portalRef: 'MP-4711' }, admin);
    assert.equal(sub.json.request.application.status, 'eingereicht');
    assert.equal((await call('PUT', `/admin/requests/${id}/application`, { fields: {} }, admin)).status, 409, 'nach Einreichen gesperrt');

    // Statistik-Ereignisse nur mit Einwilligung
    assert.equal((await call('POST', '/events', { type: 'visit', route: 'start' })).status, 400);
    assert.equal((await call('POST', '/events', { type: 'visit', route: 'start', consent: true, referrer: 'www.Google.com' })).status, 204);
    const stats = (await call('GET', '/admin/analytics?days=7', undefined, admin)).json;
    assert.equal(stats.totals.visits, 1);
    assert.deepEqual(stats.referrers, [{ key: 'google.com', count: 1 }]);
  } finally {
    server.close();
  }
});
