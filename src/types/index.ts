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

export type OptimizationStage =
  | 'dokumenten_pruefung'   // 1. Unterlagen- & Rechnungsprüfung
  | 'tarif_vergleich'       // 2. KI-Tarifvergleich läuft
  | 'angebot_versendet'     // 3. Angebot vorgelegt (E-Mail/WhatsApp)
  | 'vollmacht_erteilt'     // 4. Auftrag & Vollmacht erteilt
  | 'wechsel_eingereicht'   // 5. Kündigung & Wechsel beim Versorger eingereicht
  | 'erfolgreich_aktiv'     // 6. Neuer Vertrag aktiv & Ersparnis realisiert
  | 'wiedervorlage';        // 7. Fristen-Wächter / Wiedervorlage vor Laufzeitende

export interface CustomerOptimizationProcess {
  id: string;
  service: ServiceType;
  stage: OptimizationStage;
  currentProvider: string;
  targetProvider?: string;
  targetTariff?: string;
  potentialAnnualSavings: number; // in €
  currentMonthlyInstallment: number; // in €
  projectedMonthlyInstallment?: number; // in €
  startedDate: string;
  lastUpdatedDate: string;
  notes: string;
}

export type NoteType = 'notiz' | 'telefonat' | 'beratung_vor_ort' | 'whatsapp' | 'email' | 'wiedervorlage';

export interface CustomerNoteEntry {
  id: string;
  date: string; // e.g. "08.10.2026, 14:35"
  type: NoteType;
  author: string; // e.g. "Daryos Kreis"
  title: string;
  content: string;
  actionRequired?: boolean;
  actionDone?: boolean;
  followUpDate?: string;
  pinned?: boolean;
}

export interface CustomerContact {
  id: string;
  customerNumber: string; // e.g. "KD-2026-001"
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city: string; // e.g. "Leipzig"
  postalCode?: string; // e.g. "04329"
  preferredContact: ConsultationType;
  customerSince: string;
  tags: string[]; // e.g. ["Stammkunde", "Leipzig-Ost", "Gas + Strom"]
  contracts: ContractRecord[];
  optimizationProcesses: CustomerOptimizationProcess[];
  notes: string;
  noteEntries?: CustomerNoteEntry[];
  totalAnnualSavingsCalculated: number;
  status: 'aktiv' | 'in_optimierung' | 'abgeschlossen' | 'interessent';
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

// 1. Kunden-Meldungen (Anfragen, Zähler-Uploads, Rückrufbitten)
export interface CustomerMessage {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: 'rechnung_upload' | 'rueckruf' | 'tarif_pruefung' | 'kuendigung' | 'frage';
  title: string;
  message: string;
  service: ServiceType | 'allgemein';
  status: 'neu' | 'in_bearbeitung' | 'erledigt';
  priority: 'normal' | 'dringend';
}

// 2. Projekte & Wechselaufträge
export interface OptimizationProject {
  id: string;
  projectNumber: string; // e.g. "PRJ-2026-081"
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: ServiceType;
  title: string;
  currentProvider: string;
  targetProvider: string;
  stage: '1_check' | '2_vergleich' | '3_angebot' | '4_auftrag' | '5_aktiv';
  stageLabel: string;
  progressPercent: number;
  annualSavingsTarget: number;
  deadlineDate: string;
  assignedAdvisor: string;
  status: 'in_bearbeitung' | 'wartet_auf_kunde' | 'erfolgreich' | 'pausiert';
  lastAction: string;
}

// 3. Angebote & Tarifvergleiche
export interface CustomerOffer {
  id: string;
  offerNumber: string; // e.g. "ANG-2026-012"
  date: string;
  validUntil: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: ServiceType;
  currentProvider: string;
  currentTariff: string;
  currentMonthly: number;
  currentAnnual: number;
  recommendedProvider: string;
  recommendedTariff: string;
  recommendedMonthly: number;
  recommendedAnnual: number;
  annualSavings: number;
  guaranteeMonths: number;
  status: 'entwurf' | 'versendet' | 'angenommen' | 'abgelehnt';
  notes?: string;
}

// 4. Rechnungsposition & Vollfunktions-Rechnung
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "RE-2026-0042"
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  customerEmail: string;
  customerPhone?: string;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: string;
  taxRate: number; // 19 or 0
  taxType: 'standard_19' | 'kleinunternehmer_0' | 'provision_0';
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'offen' | 'bezahlt' | 'ueberfaellig' | 'storniert';
  notes: string;
  iban: string;
  bic: string;
  bankName: string;
}
