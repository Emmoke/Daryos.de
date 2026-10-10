// DEMO-Angebotsquelle: frei erfundene Testtarife mit fiktiven Anbieternamen.
// Sie dienen ausschließlich dazu, den Ablauf zu testen, und werden überall als DEMO gekennzeichnet.
import type { ComparisonInput, Offer } from '../../shared/platform';
import type { OfferFetchResult, OfferProvider, OfferProviderInfo } from './OfferProvider';

type DemoTariff = Omit<Offer, 'id' | 'energyType' | 'source' | 'available'> & { key: string };

const GAS: DemoTariff[] = [
  {
    key: 'g1', providerName: 'DEMO Stadtgas Muster', tariffName: 'Testtarif Gas Fix 12',
    workPriceCtPerKwh: 9.1, basePriceEurPerMonth: 13.5, bonuses: [], priceGuaranteeMonths: 12,
    priceGuaranteeType: 'eingeschränkte Preisgarantie (ohne Steuern/Abgaben)', contractTermMonths: 12, noticePeriodWeeks: 4,
  },
  {
    key: 'g2', providerName: 'DEMO Energie Beispiel AG', tariffName: 'Testtarif Gas Flex',
    workPriceCtPerKwh: 9.8, basePriceEurPerMonth: 9.9, bonuses: [], priceGuaranteeMonths: 0,
    contractTermMonths: 1, noticePeriodWeeks: 2,
  },
  {
    key: 'g3', providerName: 'DEMO Versorger Nord', tariffName: 'Testtarif Gas Bonus 24',
    workPriceCtPerKwh: 9.4, basePriceEurPerMonth: 12.0,
    bonuses: [{ label: 'Neukundenbonus (Demo)', amountEur: 120, conditions: 'Einmalig nach 12 Monaten ununterbrochener Belieferung', oneTime: true }],
    priceGuaranteeMonths: 24, priceGuaranteeType: 'eingeschränkte Preisgarantie', contractTermMonths: 24, noticePeriodWeeks: 4, eco: true,
  },
  {
    // absichtlich unvollständig: zeigt, dass unvollständige Angebote nicht gerankt werden
    key: 'g4', providerName: 'DEMO Unvollständig GmbH', tariffName: 'Testtarif ohne Grundpreis',
    workPriceCtPerKwh: 8.7, basePriceEurPerMonth: null, bonuses: [], priceGuaranteeMonths: null,
    contractTermMonths: 12, noticePeriodWeeks: null,
  },
];

const STROM: DemoTariff[] = [
  {
    key: 's1', providerName: 'DEMO Stadtwerk Muster', tariffName: 'Testtarif Strom Fix 12',
    workPriceCtPerKwh: 27.9, basePriceEurPerMonth: 11.0, bonuses: [], priceGuaranteeMonths: 12,
    priceGuaranteeType: 'eingeschränkte Preisgarantie', contractTermMonths: 12, noticePeriodWeeks: 4, eco: true,
  },
  {
    key: 's2', providerName: 'DEMO Energie Beispiel AG', tariffName: 'Testtarif Strom Flex',
    workPriceCtPerKwh: 29.5, basePriceEurPerMonth: 8.5, bonuses: [], priceGuaranteeMonths: 0,
    contractTermMonths: 1, noticePeriodWeeks: 2,
  },
  {
    key: 's3', providerName: 'DEMO Versorger Nord', tariffName: 'Testtarif Strom Bonus 24',
    workPriceCtPerKwh: 28.4, basePriceEurPerMonth: 12.5,
    bonuses: [{ label: 'Sofortbonus (Demo)', amountEur: 80, conditions: 'Einmalig, Gutschrift mit erster Jahresrechnung', oneTime: true }],
    priceGuaranteeMonths: 24, priceGuaranteeType: 'eingeschränkte Preisgarantie', contractTermMonths: 24, noticePeriodWeeks: 4, eco: true,
  },
];

export class DemoOfferProvider implements OfferProvider {
  readonly info: OfferProviderInfo = { id: 'demo', name: 'DEMO-Testdaten (keine realen Tarife)', isDemo: true, configured: true };

  constructor(private readonly now: () => Date = () => new Date()) {}

  async fetchOffers(input: ComparisonInput): Promise<OfferFetchResult> {
    const fetchedAt = this.now().toISOString();
    // Test-Hooks: bestimmte Test-PLZ simulieren Störungen bzw. leere Ergebnisse.
    if (input.postalCode === '99999') throw new Error('Simulierter Ausfall der Demo-Quelle');
    if (input.postalCode === '00000') return { offers: [], fetchedAt };

    const tariffs = input.energyType === 'gas' ? GAS : STROM;
    const offers: Offer[] = tariffs.map((t) => {
      const { key, ...rest } = t;
      return {
        ...rest,
        id: `demo-${input.energyType}-${key}`,
        energyType: input.energyType,
        available: true,
        earliestStartDate: input.desiredStartDate,
        source: { providerId: this.info.id, name: this.info.name, isDemo: true, fetchedAt },
      };
    });
    return { offers, fetchedAt };
  }
}
