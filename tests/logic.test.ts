import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateComparisonInput, validateContactInput } from '../server/validation';
import { calculateCost, rankOffers } from '../server/comparison';
import { DemoOfferProvider } from '../server/offers';
import { transition, TransitionError } from '../server/workflow';
import { hashPassword, verifyPassword, RateLimiter, SessionManager } from '../server/security';
import { newRequestId, REQUEST_ID_PATTERN } from '../server/store';
import type { ComparisonInput, Offer } from '../shared/platform';

const NOW = new Date('2026-10-10T10:00:00Z');
const gasInput: ComparisonInput = { energyType: 'gas', postalCode: '04109', annualConsumptionKwh: 12000 };

test('Vergleichseingabe: gültige Daten werden bereinigt übernommen', () => {
  const r = validateComparisonInput({ energyType: 'gas', postalCode: ' 04109 ', annualConsumptionKwh: '12000,4', desiredStartDate: '2026-11-01' }, NOW);
  assert.ok(r.ok);
  assert.equal(r.value.postalCode, '04109');
  assert.equal(r.value.annualConsumptionKwh, 12000);
});

test('Vergleichseingabe: ungültige und fehlende Daten liefern Feldfehler', () => {
  const r = validateComparisonInput({ energyType: 'wasser', postalCode: '123', annualConsumptionKwh: 5, desiredStartDate: '2020-01-01', maxContractMonths: 7 }, NOW);
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors).sort(), ['annualConsumptionKwh', 'desiredStartDate', 'energyType', 'maxContractMonths', 'postalCode']);
  assert.ok(!validateComparisonInput(null).ok);
  assert.ok(!validateComparisonInput({ energyType: 'gas', postalCode: '04109' }).ok, 'Verbrauch ist Pflicht');
});

test('Kontakteingabe: Einwilligungen und Telefonnummer für WhatsApp sind Pflicht', () => {
  const base = { offerId: 'demo-gas-g1', name: 'Max Muster', email: 'MAX@example.de', consentPrivacy: true };
  const ok = validateContactInput(base);
  assert.ok(ok.ok);
  assert.equal(ok.value.email, 'max@example.de');
  const noConsent = validateContactInput({ ...base, consentPrivacy: false });
  assert.ok(!noConsent.ok && noConsent.errors.consentPrivacy);
  const wa = validateContactInput({ ...base, preferredChannel: 'whatsapp' });
  assert.ok(!wa.ok && wa.errors.phone && wa.errors.consentWhatsapp);
});

test('Kostenberechnung: Grundpreis×12 + Arbeitspreis×Verbrauch, Bonus nur im ersten Jahr', () => {
  const offer = { workPriceCtPerKwh: 9.4, basePriceEurPerMonth: 12, bonuses: [{ label: 'B', amountEur: 120, conditions: 'x', oneTime: true }] } as Offer;
  const c = calculateCost(offer, { ...gasInput, currentAnnualCostEur: 1500 })!;
  assert.equal(c.baseCostEur, 144);
  assert.equal(c.workCostEur, 1128);
  assert.equal(c.annualCostWithoutBonusEur, 1272);
  assert.equal(c.firstYearCostWithBonusEur, 1152);
  assert.equal(c.savingsVsCurrentEur, 228, 'Ersparnis ohne Bonus');
});

test('Ranking: unvollständige Angebote werden nicht gerankt, "günstigstes" nur bei fairem Vergleich', async () => {
  const { offers } = await new DemoOfferProvider(() => NOW).fetchOffers(gasInput);
  const r = rankOffers(offers, gasInput);
  assert.equal(r.excludedIncompleteCount, 1);
  assert.equal(r.cheapestFlagValid, false);
  assert.ok(r.offers.every((o) => !o.isCheapest));
  assert.equal(r.offers.at(-1)!.complete, false);
  const complete = r.offers.filter((o) => o.complete).map((o) => o.cost!.annualCostWithoutBonusEur);
  assert.deepEqual(complete, [...complete].sort((a, b) => a - b));

  const fair = rankOffers(offers.filter((o) => o.basePriceEurPerMonth !== null), gasInput);
  assert.equal(fair.cheapestFlagValid, true);
  assert.equal(fair.offers[0].isCheapest, true);
});

test('Ranking: Präferenzen (Laufzeit, Preisgarantie, Öko) filtern', async () => {
  const { offers } = await new DemoOfferProvider(() => NOW).fetchOffers(gasInput);
  assert.ok(rankOffers(offers, { ...gasInput, maxContractMonths: 12 }).offers.every((o) => (o.offer.contractTermMonths ?? 0) <= 12));
  assert.ok(rankOffers(offers, { ...gasInput, minPriceGuaranteeMonths: 24 }).offers.every((o) => o.offer.priceGuaranteeMonths! >= 24));
  assert.ok(rankOffers(offers, { ...gasInput, ecoOnly: true }).offers.every((o) => o.offer.eco));
});

test('Demo-Angebote sind immer als DEMO gekennzeichnet', async () => {
  const { offers } = await new DemoOfferProvider(() => NOW).fetchOffers({ ...gasInput, energyType: 'strom' });
  assert.ok(offers.length > 0);
  for (const o of offers) {
    assert.equal(o.source.isDemo, true);
    assert.match(o.providerName, /^DEMO /);
  }
});

test('Statusmaschine: nur erlaubte Übergänge, jeder Wechsel protokolliert', () => {
  const rec = { status: 'WAITING_FOR_ADMIN' as const, history: [], updatedAt: '' } as { status: any; history: any[]; updatedAt: string };
  assert.throws(() => transition(rec, 'COMPLETED', 'admin'), TransitionError, 'Kein Abschluss ohne Freigabe/Einreichung');
  transition(rec, 'APPROVED', 'admin:x', 'ok', NOW);
  assert.equal(rec.status, 'APPROVED');
  assert.deepEqual(rec.history[0], { at: NOW.toISOString(), actor: 'admin:x', from: 'WAITING_FOR_ADMIN', to: 'APPROVED', note: 'ok' });
});

test('Sicherheit: Passwort-Hash, Sitzungsablauf, Rate-Limit, Anfrage-ID', () => {
  const h = hashPassword('richtig-langes-passwort');
  assert.ok(verifyPassword('richtig-langes-passwort', h));
  assert.ok(!verifyPassword('falsch', h));
  assert.ok(!verifyPassword('x', 'kaputt'));

  let t = 0;
  const sessions = new SessionManager(1000, () => t);
  const token = sessions.create({ role: 'eigentuemer', email: 'a@b.de', name: 'A' });
  assert.ok(sessions.get(token));
  t = 2000;
  assert.equal(sessions.get(token), undefined);

  const rl = new RateLimiter(2, 1000, () => t);
  assert.ok(rl.allow('ip') && rl.allow('ip'));
  assert.ok(!rl.allow('ip'));
  t = 4000;
  assert.ok(rl.allow('ip'));

  const ids = new Set(Array.from({ length: 500 }, newRequestId));
  assert.equal(ids.size, 500);
  for (const id of ids) assert.match(id, REQUEST_ID_PATTERN);
});
