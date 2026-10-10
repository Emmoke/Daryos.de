// Vergleichslogik: Vollständigkeitsprüfung, nachvollziehbare Kostenberechnung und Ranking.
import type { ComparisonInput, CostBreakdown, Offer, RankedOffer } from '../shared/platform';

const REQUIRED_FIELDS: { key: keyof Offer; label: string }[] = [
  { key: 'workPriceCtPerKwh', label: 'Arbeitspreis' },
  { key: 'basePriceEurPerMonth', label: 'Grundpreis' },
  { key: 'contractTermMonths', label: 'Vertragslaufzeit' },
  { key: 'noticePeriodWeeks', label: 'Kündigungsfrist' },
  { key: 'priceGuaranteeMonths', label: 'Preisgarantie' },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function missingFields(offer: Offer): string[] {
  const missing = REQUIRED_FIELDS.filter(({ key }) => offer[key] === null || offer[key] === undefined).map((f) => f.label);
  if (!offer.providerName?.trim()) missing.push('Anbieter');
  if (!offer.tariffName?.trim()) missing.push('Tarifname');
  if (!offer.source?.fetchedAt) missing.push('Abrufzeitpunkt');
  return missing;
}

/**
 * Jahreskosten = Grundpreis × 12 + Arbeitspreis × Verbrauch.
 * Einmalboni werden nur für das erste Jahr separat ausgewiesen, nie als dauerhafte Ersparnis.
 */
export function calculateCost(offer: Offer, input: ComparisonInput): CostBreakdown | null {
  if (offer.workPriceCtPerKwh === null || offer.basePriceEurPerMonth === null) return null;
  const baseCostEur = round2(offer.basePriceEurPerMonth * 12);
  const workCostEur = round2((offer.workPriceCtPerKwh * input.annualConsumptionKwh) / 100);
  const annualCostWithoutBonusEur = round2(baseCostEur + workCostEur);
  const oneTimeBonusEur = round2(offer.bonuses.filter((b) => b.oneTime).reduce((s, b) => s + b.amountEur, 0));
  return {
    baseCostEur,
    workCostEur,
    annualCostWithoutBonusEur,
    firstYearCostWithBonusEur: round2(annualCostWithoutBonusEur - oneTimeBonusEur),
    oneTimeBonusEur,
    savingsVsCurrentEur:
      input.currentAnnualCostEur !== undefined ? round2(input.currentAnnualCostEur - annualCostWithoutBonusEur) : null,
    isEstimate: true,
  };
}

function matchesPreferences(offer: Offer, input: ComparisonInput): boolean {
  if (!offer.available) return false;
  if (offer.energyType !== input.energyType) return false;
  if (input.ecoOnly && !offer.eco) return false;
  if (input.maxContractMonths !== undefined && offer.contractTermMonths !== null && offer.contractTermMonths > input.maxContractMonths) return false;
  if (
    input.minPriceGuaranteeMonths !== undefined &&
    input.minPriceGuaranteeMonths > 0 &&
    (offer.priceGuaranteeMonths === null || offer.priceGuaranteeMonths < input.minPriceGuaranteeMonths)
  ) {
    return false;
  }
  return true;
}

export interface RankingOutput {
  offers: RankedOffer[];
  cheapestFlagValid: boolean;
  excludedIncompleteCount: number;
}

/**
 * Sortiert vollständige Angebote nach laufenden Jahreskosten (ohne Boni).
 * Unvollständige Angebote werden angehängt, aber nicht gerankt.
 * Die Markierung „günstigstes Angebot“ wird nur gesetzt, wenn alle passenden Angebote vollständig sind.
 */
export function rankOffers(offers: Offer[], input: ComparisonInput): RankingOutput {
  const matching = offers.filter((o) => matchesPreferences(o, input));
  const evaluated: RankedOffer[] = matching.map((offer) => {
    const missing = missingFields(offer);
    return { offer, complete: missing.length === 0, missingFields: missing, cost: missing.length ? null : calculateCost(offer, input), isCheapest: false };
  });
  const complete = evaluated.filter((o) => o.complete).sort((a, b) => a.cost!.annualCostWithoutBonusEur - b.cost!.annualCostWithoutBonusEur);
  const incomplete = evaluated.filter((o) => !o.complete);
  const cheapestFlagValid = complete.length > 1 && incomplete.length === 0;
  if (cheapestFlagValid) complete[0].isCheapest = true;
  return { offers: [...complete, ...incomplete], cheapestFlagValid, excludedIncompleteCount: incomplete.length };
}
