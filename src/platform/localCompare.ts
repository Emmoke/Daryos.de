// Vorschau-Modus für statisches Hosting (z. B. GitHub Pages): Ohne Server läuft der Vergleich im Browser –
// ausschließlich mit den als DEMO gekennzeichneten Testangeboten und derselben Vergleichslogik wie auf dem Server.
// Es wird nichts gespeichert; Anfragen gehen per WhatsApp an Daryos.
import type { ComparisonInput, RankedOffer } from '../../shared/platform';
import { rankOffers } from '../../server/comparison';
import { DemoOfferProvider } from '../../server/offers/demoProvider';
import { validateComparisonInput } from '../../server/validation';
import type { CompareResponse } from './api';

export type LocalCompareResult = { ok: true; response: CompareResponse; input: ComparisonInput } | { ok: false; fields: Record<string, string> };

export async function compareLocally(payload: unknown): Promise<LocalCompareResult> {
  const parsed = validateComparisonInput(payload);
  if (!parsed.ok) return { ok: false, fields: parsed.errors };
  const provider = new DemoOfferProvider();
  const { offers, fetchedAt } = await provider.fetchOffers(parsed.value);
  const ranked = rankOffers(offers, parsed.value);
  return {
    ok: true,
    input: parsed.value,
    response: {
      requestId: `VORSCHAU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'OFFERS_FOUND',
      comparison: {
        status: ranked.offers.length ? 'ok' : 'no_offers',
        message: ranked.offers.length ? undefined : 'Für Ihre Angaben wurden keine passenden Demo-Angebote gefunden. Lockern Sie z. B. Laufzeit oder Preisgarantie.',
        providerId: provider.info.id,
        providerName: `${provider.info.name} – Vorschau im Browser`,
        isDemo: true,
        fetchedAt,
        ...ranked,
      },
    },
  };
}

export function whatsappInquiryUrl(ranked: RankedOffer, input: ComparisonInput, number = '4917643416174') {
  const o = ranked.offer;
  const cost = ranked.cost ? `, ca. ${ranked.cost.annualCostWithoutBonusEur.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Jahr` : '';
  const text = `Hallo Daryos, ich interessiere mich für einen ${input.energyType === 'gas' ? 'Gas' : 'Strom'}vertrag.
PLZ ${input.postalCode}, Verbrauch ${input.annualConsumptionKwh.toLocaleString('de-DE')} kWh/Jahr${input.desiredStartDate ? `, Lieferbeginn ${input.desiredStartDate}` : ''}.
Im Online-Vergleich (Vorschau, Demo-Daten) habe ich gesehen: ${o.tariffName}${cost}.
Bitte prüfen Sie für mich echte, aktuell verfügbare Angebote.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
