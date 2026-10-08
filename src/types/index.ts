export type Language = 'de' | 'en' | 'tr' | 'ku' | 'ar';

export type ServiceType = 'strom' | 'gas' | 'internet' | 'kfz';

export type ConsultationType = 'vor-ort' | 'telefon' | 'video' | 'whatsapp';

export interface ContractRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  service: ServiceType;
  provider: string;
  tariffName: string;
  meterNumber?: string;
  annualKwh?: number;
  currentMonthlyInstallment: number; // in €
  startDate: string; // e.g. 2025-11-01
  durationMonths: number; // 12 or 24
  noticePeriodDays: number; // e.g. 30 days
  endDate: string; // e.g. 2026-10-31
  status: 'active' | 'warning_renewal' | 'critical_cancellation' | 'renewed';
  provision: number; // in €
  accountingInvoiceId: string; // e.g. RE-2026-088
  accountingStatus: 'gebucht' | 'ausgezahlt' | 'offen';
  safeInstallmentRecommended: number; // €/month recommended to avoid backpayments
  backpaymentRisk: number; // +/- difference in €
  nextBestOffer?: {
    provider: string;
    tariff: string;
    newMonthly: number;
    newAnnual: number;
    savingsPerYear: number;
  };
}

export interface KiAuditLead {
  id: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: ServiceType;
  currentProvider: string;
  annualKwh: number;
  currentMonthly: number;
  currentAnnual: number;
  meterNumber?: string;
  bestOfferName: string;
  bestOfferProvider: string;
  bestOfferAnnual: number;
  bestOfferMonthly: number;
  calculatedSavings: number;
  provisionExpected: number;
  aiConfidence: number; // e.g. 98%
  status: 'neu' | 'angebot_gesendet' | 'abgeschlossen' | 'abgelehnt';
  notes: string;
}

export interface NachzahlungCalculation {
  service: ServiceType;
  annualKwh: number;
  currentMonthlyPaid: number;
  arbeitspreisCt: number;
  grundpreisMonthly: number;
  expectedAnnualCost: number;
  paidAnnualTotal: number;
  difference: number; // positive = Nachzahlung droht!, negative = Guthaben!
  recommendedSafeMonthly: number;
  riskStatus: 'danger' | 'safe' | 'overpay';
}

export interface ServiceDetail {
  id: ServiceType;
  title: string;
  tagline: string;
  badge: string;
  image: string;
  description: string;
  savingsHint: string;
  bulletPoints: string[];
  requiredDocs: string[];
  providersExample: string[];
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  service: ServiceType | 'allgemein';
  rating: number;
  date: string;
  savings: string;
  comment: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: ServiceType | 'allgemein';
}

export interface AppointmentData {
  consultationType: ConsultationType;
  serviceType: ServiceType | 'all';
  date: string;
  timeSlot: string;
  fullName: string;
  phone: string;
  email: string;
  currentProvider?: string;
  notes?: string;
}
