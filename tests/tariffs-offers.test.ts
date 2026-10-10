import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { CatalogOrFallbackProvider, TariffCatalog } from '../server/tariffs';
import { DemoOfferProvider } from '../server/offers';
import { AssistantConfigStore, toolInstructions } from '../server/assistantConfig';
import { buildChatPrompt, buildTemplateDraft, DisabledAssistant, keepsAllNumbers } from '../server/assistant';
import { createApp, type AppDeps } from '../server/app';
import { MemoryRequestStore } from '../server/store';
import { hashPassword, RateLimiter, SessionManager } from '../server/security';
import type { Notifier } from '../server/notifier';
import type { NotificationLog } from '../server/store';

const NOW = new Date('2026-10-10T10:00:00Z');
const tariff = (over: Record<string, unknown> = {}) => ({
  energyType: 'strom', providerName: 'Stadtwerke Muster', tariffName: 'Strom Fix 12', workPriceCtPerKwh: '27,9', basePriceEurPerMonth: '11',
  priceGuaranteeMonths: 12, contractTermMonths: 12, noticePeriodWeeks: 4, postalCodes: '04, 06846', validFrom: '2026-10-01', validUntil: '2026-12-31',
  source: 'Maklerpool Test, Abruf 10.10.2026', officialUrl: 'https://example.org/tarif', ...over,
});

test('Tarifkatalog: Validierung verlangt Quelle, Gültigkeit und plausible Preise', async () => {
  const c = await TariffCatalog.open(undefined, () => NOW);
  await assert.rejects(c.create(tariff({ source: '', validUntil: '', workPriceCtPerKwh: '-1' }), 'a'), (e: any) => !!(e.fields.source && e.fields.validUntil && e.fields.workPriceCtPerKwh));
  await assert.rejects(c.create(tariff({ officialUrl: 'http://unsicher.de' }), 'a'), (e: any) => !!e.fields.officialUrl);
  await assert.rejects(c.create(tariff({ bonusEur: 50 }), 'a'), (e: any) => !!e.fields.bonusConditions, 'Bonus ohne Bedingungen');
  const t = await c.create(tariff(), 'admin:x');
  assert.equal(t.workPriceCtPerKwh, 27.9);
  assert.deepEqual(t.postalCodes, ['04', '06846']);
});

test('Angebotsquelle: DEMO nur ohne Katalog; Katalog filtert PLZ, Gültigkeit, Verbrauch – nie gemischt', async () => {
  const c = await TariffCatalog.open(undefined, () => NOW);
  const p = new CatalogOrFallbackProvider(c, new DemoOfferProvider());
  const input = { energyType: 'strom' as const, postalCode: '04109', annualConsumptionKwh: 3000 };
  assert.equal(p.info.isDemo, true);
  assert.ok((await p.fetchOffers(input, new AbortController().signal)).offers.every((o) => o.source.isDemo));

  await c.create(tariff(), 'a');
  await c.create(tariff({ tariffName: 'Abgelaufen', validFrom: '2026-01-01', validUntil: '2026-09-30' }), 'a');
  await c.create(tariff({ tariffName: 'Nur Dresden', postalCodes: '01' }), 'a');
  await c.create(tariff({ tariffName: 'Großverbraucher', minKwh: 10000 }), 'a');
  await c.create(tariff({ tariffName: 'Inaktiv', active: false }), 'a');
  assert.equal(p.info.isDemo, false);
  assert.equal(p.info.id, 'daryos-katalog');
  const { offers } = await p.fetchOffers(input, new AbortController().signal);
  assert.deepEqual(offers.map((o) => o.tariffName), ['Strom Fix 12']);
  assert.equal(offers[0].source.isDemo, false);
  assert.equal(offers[0].officialUrl, 'https://example.org/tarif');
  assert.equal((await p.fetchOffers({ ...input, postalCode: '80331' }, new AbortController().signal)).offers.length, 0, 'keine DEMO-Auffüllung');
});

test('KI-Sicherheitsprüfung: geänderte Zahlen werden erkannt', () => {
  assert.ok(keepsAllNumbers('Preis 27,9 ct und 11,00 €', 'Der Preis liegt bei 27,9 ct, Grundpreis 11,00 €.'));
  assert.ok(!keepsAllNumbers('Preis 27,9 ct', 'Preis 25,9 ct'));
});

test('Assistent-Prompt enthält Wissen, Werkzeuge und Zusatzhinweise – Regeln haben Vorrang', () => {
  const prompt = buildChatPrompt([{ role: 'user', text: 'Samstag offen?' }], {
    extraInstructions: 'Antworte kurz.',
    knowledge: [{ question: 'Samstag?', answer: 'Nach Vereinbarung.' }],
    toolInstructions: toolInstructions({ comparison: true, booking: false, whatsapp: true, status: true }),
  });
  assert.match(prompt, /Nach Vereinbarung/);
  assert.match(prompt, /Keine Terminbuchung anbieten/);
  assert.match(prompt, /Regeln haben immer Vorrang/);
});

test('Chatverläufe: speichern, auswerten, abschaltbar, löschen nach 30 Tagen', async () => {
  let now = NOW;
  const s = await AssistantConfigStore.open(undefined, () => now);
  const id = await s.record(undefined, 'Was kostet die Beratung?', 'Kostenlos.');
  await s.record(id, 'Ich möchte einen Rückruf', 'Gerne.');
  await s.record(undefined, 'Was kostet die Beratung?', null);
  const st = s.stats();
  assert.equal(st.sessions, 2);
  assert.equal(st.topQuestions[0].count, 2);
  assert.equal(st.handoverRate, 50);
  assert.equal(st.failedReplies, 1);
  await s.updateSettings({ storeTranscripts: false }, 'a');
  assert.equal(await s.record(undefined, 'x', 'y'), undefined);
  now = new Date(NOW.getTime() + 31 * 86_400_000);
  assert.equal(await s.purgeExpired(now), 2);
});

class FakeNotifier implements Notifier {
  configured = true;
  detail = 'Test-SMTP';
  sent: { to: string; subject: string }[] = [];
  fail = false;
  async notifyAdminNewRequest(): Promise<NotificationLog> {
    return { at: NOW.toISOString(), channel: 'email', recipient: 'admin', status: 'sent', detail: 'ok' };
  }
  async sendCustomerEmail(to: string, subject: string): Promise<NotificationLog> {
    if (this.fail) return { at: NOW.toISOString(), channel: 'email', recipient: 'customer', status: 'failed', detail: 'SMTP-Fehler' };
    this.sent.push({ to, subject });
    return { at: NOW.toISOString(), channel: 'email', recipient: 'customer', status: 'sent', detail: `an ${to}` };
  }
}

test('Angebots-E-Mail: Entwurf mit echten Daten, bearbeiten, senden nur mit Bestätigung, DEMO gesperrt', async () => {
  const catalog = await TariffCatalog.open(undefined, () => new Date());
  const notifier = new FakeNotifier();
  const deps: AppDeps = {
    store: new MemoryRequestStore(),
    offerProvider: new CatalogOrFallbackProvider(catalog, new DemoOfferProvider()),
    notifier,
    assistant: new DisabledAssistant(),
    sessions: new SessionManager(),
    admin: { email: 'inhaber@daryos.test', name: 'Inhaber', passwordHash: hashPassword('passwort-1234567') },
    tariffs: catalog,
    assistantConfig: await AssistantConfigStore.open(),
    secureCookies: false,
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
  const c = (await call('POST', '/admin/login', { password: 'passwort-1234567' })).cookie!;

  // 1) DEMO-Anfrage: Entwurf möglich, Versand gesperrt
  const demo = await call('POST', '/compare', { energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3000 });
  await call('POST', `/requests/${demo.json.requestId}/contact`, { offerId: demo.json.comparison.offers[0].offer.id, name: 'Erika', email: 'erika@example.de', consentPrivacy: true });
  const dDraft = await call('POST', `/admin/requests/${demo.json.requestId}/draft`, {}, c);
  assert.equal(dDraft.json.draft.offerIsDemo, true);
  const dSend = await call('POST', `/admin/requests/${demo.json.requestId}/drafts/${dDraft.json.draft.id}/send`, { confirm: true }, c);
  assert.equal(dSend.status, 409);
  assert.equal(notifier.sent.length, 0);

  // 2) Echter Katalog-Tarif
  const today = new Date().toISOString().slice(0, 10);
  const t = await call('POST', '/admin/tariffs', tariff({ validFrom: today, validUntil: '2099-12-31' }), c);
  assert.equal(t.status, 201);
  assert.equal((await call('GET', '/integrations')).json.offerProvider.isDemo, false);
  const cmp = await call('POST', '/compare', { energyType: 'strom', postalCode: '04109', annualConsumptionKwh: 3000 });
  assert.equal(cmp.json.comparison.offers[0].offer.tariffName, 'Strom Fix 12');
  const id = cmp.json.requestId;
  await call('POST', `/requests/${id}/contact`, { offerId: cmp.json.comparison.offers[0].offer.id, name: 'Max', email: 'max@example.de', consentPrivacy: true });
  const draft = await call('POST', `/admin/requests/${id}/draft`, { offerId: cmp.json.comparison.offers[0].offer.id }, c);
  const body: string = draft.json.draft.body;
  assert.match(body, /27,9 ct\/kWh/);
  assert.match(body, /Maklerpool Test/);
  assert.match(body, /noch kein Vertragsabschluss/);
  assert.match(body, /https:\/\/example.org\/tarif/);

  const did = draft.json.draft.id;
  assert.equal((await call('POST', `/admin/requests/${id}/drafts/${did}/send`, {}, c)).status, 400, 'ohne Bestätigung');
  assert.equal((await call('PUT', `/admin/requests/${id}/drafts/${did}`, { subject: 'Ihr Angebot', body: body + '\nPS: Gerne auch telefonisch.' }, c)).status, 200);

  notifier.fail = true;
  assert.equal((await call('POST', `/admin/requests/${id}/drafts/${did}/send`, { confirm: true }, c)).status, 502, 'Fehler ehrlich gemeldet');
  notifier.fail = false;
  const sent = await call('POST', `/admin/requests/${id}/drafts/${did}/send`, { confirm: true }, c);
  assert.equal(sent.status, 200);
  assert.deepEqual(notifier.sent, [{ to: 'max@example.de', subject: 'Ihr Angebot' }]);
  const d = sent.json.request.drafts.find((x: any) => x.id === did);
  assert.equal(d.sentBy, 'admin:inhaber@daryos.test');
  assert.equal((await call('POST', `/admin/requests/${id}/drafts/${did}/send`, { confirm: true }, c)).status, 409, 'kein Doppelversand');
  assert.equal((await call('PUT', `/admin/requests/${id}/drafts/${did}`, { subject: 'Neu', body: body }, c)).status, 409, 'nach Versand unveränderbar');
  assert.ok(sent.json.request.history.some((h: any) => /an den Kunden gesendet/.test(h.note ?? '')));

  // 3) Assistent-Einstellungen nur angemeldet
  assert.equal((await call('GET', '/admin/assistant')).status, 401);
  const saved = await call('PUT', '/admin/assistant', { extraInstructions: 'Kurz antworten.', knowledge: [{ question: 'Samstag?', answer: 'Nach Vereinbarung.' }] }, c);
  assert.equal(saved.json.settings.knowledge.length, 1);
  assert.equal((await call('POST', '/admin/assistant/test', { question: 'Hallo?' }, c)).status, 503, 'ohne Gemini ehrlich');
  server.close();
});

test('Vorlage ohne Angebot bleibt sicher', () => {
  const d = buildTemplateDraft({ id: 'DY-AAAA-BBBB-CCCC', input: { energyType: 'gas', postalCode: '04109', annualConsumptionKwh: 1 }, comparison: null, contact: { name: 'X' } } as any);
  assert.equal(d.offerIsDemo, false);
  assert.match(d.body, /Bitte Angebot auswählen/);
});
