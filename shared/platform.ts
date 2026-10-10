// Gemeinsame Typen für Frontend und Server der Daryos-Vergleichsplattform.

export type EnergyType = 'gas' | 'strom';

export const REQUEST_STATUSES = [
  'NEW',
  'VALIDATING',
  'OFFERS_FOUND',
  'CUSTOMER_CONTACTED',
  'WAITING_FOR_ADMIN',
  'APPROVED',
  'SUBMITTED',
  'COMPLETED',
  'REJECTED',
  'ERROR',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Kundenverständliche Bezeichnung je Status. Bewusst ohne Vertragsversprechen. */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: 'Anfrage eingegangen',
  VALIDATING: 'Angaben werden geprüft',
  OFFERS_FOUND: 'Angebote ermittelt',
  CUSTOMER_CONTACTED: 'Kontaktanfrage gesendet',
  WAITING_FOR_ADMIN: 'Wartet auf Prüfung durch Daryos',
  APPROVED: 'Von Daryos geprüft und freigegeben',
  SUBMITTED: 'Beim Anbieter eingereicht – Bestätigung ausstehend',
  COMPLETED: 'Vom Anbieter bestätigt – abgeschlossen',
  REJECTED: 'Abgelehnt / nicht weiterverfolgt',
  ERROR: 'Fehler – Daryos meldet sich',
};

export interface ComparisonInput {
  energyType: EnergyType;
  postalCode: string;
  city?: string;
  annualConsumptionKwh: number;
  householdSize?: number;
  currentProvider?: string;
  currentTariff?: string;
  /** Aktuelle Jahreskosten in Euro, falls bekannt – nur für die Ersparnisanzeige. */
  currentAnnualCostEur?: number;
  desiredStartDate?: string; // YYYY-MM-DD
  maxContractMonths?: number;
  minPriceGuaranteeMonths?: number;
  ecoOnly?: boolean;
}

/** Einheitliches Angebotsformat, in das jeder OfferProvider seine Antwort umwandelt. */
export interface Offer {
  id: string;
  providerName: string;
  tariffName: string;
  energyType: EnergyType;
  /** Arbeitspreis brutto in ct/kWh */
  workPriceCtPerKwh: number | null;
  /** Grundpreis brutto in €/Monat */
  basePriceEurPerMonth: number | null;
  bonuses: OfferBonus[];
  priceGuaranteeMonths: number | null;
  priceGuaranteeType?: string;
  contractTermMonths: number | null;
  noticePeriodWeeks: number | null;
  earliestStartDate?: string;
  available: boolean;
  eco?: boolean;
  /** Offizielle Angebots-/Vertragsseite des Anbieters, nur wenn von der Quelle geliefert. */
  officialUrl?: string;
  source: OfferSource;
}

export interface OfferBonus {
  label: string;
  amountEur: number;
  conditions: string;
  /** Einmalig im ersten Vertragsjahr – keine dauerhafte Ersparnis. */
  oneTime: boolean;
}

export interface OfferSource {
  providerId: string;
  name: string;
  isDemo: boolean;
  fetchedAt: string; // ISO
}

export interface CostBreakdown {
  baseCostEur: number;
  workCostEur: number;
  /** Laufende Jahreskosten ohne Boni */
  annualCostWithoutBonusEur: number;
  /** Kosten im ersten Jahr, wenn alle Bonusbedingungen erfüllt werden */
  firstYearCostWithBonusEur: number;
  oneTimeBonusEur: number;
  /** Ersparnis zu den angegebenen aktuellen Kosten (ohne Boni), falls bekannt */
  savingsVsCurrentEur: number | null;
  /** true = Berechnung auf Basis des angegebenen Verbrauchs; Abrechnung erfolgt nach tatsächlichem Verbrauch */
  isEstimate: true;
}

export interface RankedOffer {
  offer: Offer;
  complete: boolean;
  missingFields: string[];
  cost: CostBreakdown | null;
  isCheapest: boolean;
}

export interface ComparisonResult {
  status: 'ok' | 'no_offers' | 'provider_error' | 'provider_not_configured';
  message?: string;
  providerId: string;
  providerName: string;
  isDemo: boolean;
  fetchedAt: string;
  offers: RankedOffer[];
  /** Nur true, wenn alle Angebote vollständig waren und fair verglichen werden konnten */
  cheapestFlagValid: boolean;
  excludedIncompleteCount: number;
}

export interface StatusHistoryEntry {
  at: string;
  actor: string;
  from: RequestStatus | null;
  to: RequestStatus;
  note?: string;
}

export interface PublicRequestStatus {
  requestId: string;
  status: RequestStatus;
  statusLabel: string;
  energyType: EnergyType;
  selectedOffer: { providerName: string; tariffName: string; isDemo: boolean } | null;
  createdAt: string;
  updatedAt: string;
  history: { at: string; statusLabel: string }[];
}

export interface IntegrationStatus {
  offerProvider: { id: string; name: string; isDemo: boolean; configured: boolean };
  email: { configured: boolean; detail: string };
  whatsapp: { configured: boolean; mode: 'none' | 'click_to_chat' | 'business_api'; detail: string; number?: string };
  chat: { configured: boolean };
  assistant: { configured: boolean; detail: string };
}
