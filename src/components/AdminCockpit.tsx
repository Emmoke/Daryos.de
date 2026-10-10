import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../platform/api';
import { 
  Tablet, 
  Settings, 
  DollarSign, 
  FileSpreadsheet, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  X, 
  Save, 
  Download, 
  TrendingUp, 
  Send, 
  Lock, 
  KeyRound,
  FileText,
  Building,
  Zap,
  Flame,
  Wifi,
  Car,
  FileDown,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  UserCheck,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertOctagon,
  BellRing,
  Users,
  Crown,
  LogOut,
  User,
  Award,
  Key
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  ServiceType, 
  ContractRecord, 
  KiAuditLead, 
  NachzahlungCalculation, 
  CustomerContact,
  CustomerMessage,
  OptimizationProject,
  CustomerOffer,
  Invoice,
  AuthUser
} from '../types';
import { ProviderLogo } from './ProviderLogos';
import { CrmModule } from './CrmModule';
import { InvoiceBuilder } from './InvoiceBuilder';
import { CustomerMessagesTab, ProjectsTab, OffersTab, InvoicesTab } from './CockpitTabs';
import { MaklerVergleichTab } from './MaklerVergleichTab';

export interface TariffPricingConfig {
  stromArbeitspreis: number; // in ct/kWh (e.g. 26.8)
  stromGrundpreis: number;    // in €/month (e.g. 10.50)
  gasArbeitspreis: number;   // in ct/kWh (e.g. 8.4)
  gasGrundpreis: number;     // in €/month (e.g. 11.20)
  internetPromoPrice: number;// in €/month (e.g. 29.90)
  kfzAvgSavingsPercent: number; // e.g. 28%
  provisionStrom: number;    // in €
  provisionGas: number;      // in €
  provisionInternet: number; // in €
  provisionKfz: number;      // in €
}

interface AdminCockpitProps {
  isOpen: boolean;
  onClose: () => void;
  pricingConfig: TariffPricingConfig;
  onUpdatePricing: (newConfig: TariffPricingConfig) => void;
  authUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const AdminCockpit: React.FC<AdminCockpitProps> = ({
  isOpen,
  onClose,
  pricingConfig,
  onUpdatePricing,
  authUser,
  onLoginSuccess,
  onLogout,
  isStandaloneApp = false,
}) => {
  // Gespeicherte Eigentümer-Email (Anmeldung erfolgt serverseitig)
  const [ownerEmail, setOwnerEmail] = useState<string>(() => {
    return localStorage.getItem('daryos_owner_email') || 'Emmoke@outlook.de';
  });

  const [isPinChangeModalOpen, setIsPinChangeModalOpen] = useState(false);
  const [currentPinCheck, setCurrentPinCheck] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [editOwnerEmailInput, setEditOwnerEmailInput] = useState(ownerEmail);
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');

  const [loginRole, setLoginRole] = useState<'eigentuemer' | 'admin'>('eigentuemer');
  const [loginEmail, setLoginEmail] = useState<string>(ownerEmail);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Navigation tabs: Kunden-Meldungen, CHECK24 Makler-Verbindung, Projekte, Angebote, Rechnungen, Rechnung erstellen, Vertragsliste, CRM, Nachzahlung, Tarife
  const [activeTab, setActiveTab] = useState<
    | 'meldungen'
    | 'makler_vergleich'
    | 'projekte'
    | 'angebote'
    | 'rechnungen'
    | 'rechnung_erstellen'
    | 'vertraege'
    | 'crm'
    | 'nachzahlung'
    | 'tarife'
    | 'ki_inbox'
    | 'automatisierung'
  >('makler_vergleich');

  // Selected invoice for builder
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Config state
  const [config, setConfig] = useState<TariffPricingConfig>(pricingConfig);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // 1. KI-Leads & Rechnungs-Eingänge (Smart Intake & OCR)
  const [kiLeads, setKiLeads] = useState<KiAuditLead[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_ki_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'lead-1',
        date: '08.10.2026',
        clientName: 'Michael Weber',
        clientEmail: 'm.weber.leipzig@web.de',
        clientPhone: '+49 176 98765432',
        service: 'gas',
        currentProvider: 'Stadtwerke Leipzig (Grundversorgung)',
        annualKwh: 18000,
        currentMonthly: 155,
        currentAnnual: 1860,
        meterNumber: 'GAS-04329-8812',
        bestOfferName: 'Daryos Gas-Garant 24M (Öko)',
        bestOfferProvider: 'E.ON Energie Deutschland',
        bestOfferAnnual: 1320,
        bestOfferMonthly: 110,
        calculatedSavings: 540,
        provisionExpected: 80,
        aiConfidence: 98,
        status: 'neu',
        notes: 'Alte Stadtwerke-Rechnung übermittelt. Zählerstand & Altverbrauch exakt erkannt.',
      },
      {
        id: 'lead-2',
        date: '07.10.2026',
        clientName: 'Sabine Hoffmann',
        clientEmail: 'sabine.hoffmann@gmx.de',
        clientPhone: '+49 152 12345678',
        service: 'strom',
        currentProvider: 'Vattenfall Easy',
        annualKwh: 3400,
        currentMonthly: 118,
        currentAnnual: 1416,
        meterNumber: 'STR-99214-4401',
        bestOfferName: 'Daryos Grünstrom 12M',
        bestOfferProvider: 'Yello Strom',
        bestOfferAnnual: 1037,
        bestOfferMonthly: 86,
        calculatedSavings: 379,
        provisionExpected: 65,
        aiConfidence: 96,
        status: 'angebot_gesendet',
        notes: 'Umzug nach Paunsdorf, Angebot per E-Mail bereits vorab generiert.',
      },
      {
        id: 'lead-3',
        date: '06.10.2026',
        clientName: 'Tarik Özdemir',
        clientEmail: 't.oezdemir@outlook.com',
        clientPhone: '+49 171 44556677',
        service: 'kfz',
        currentProvider: 'HUK-COBURG',
        annualKwh: 0,
        currentMonthly: 78,
        currentAnnual: 936,
        bestOfferName: 'Daryos Premium Mobil Schutz',
        bestOfferProvider: 'Allianz Direct',
        bestOfferAnnual: 656,
        bestOfferMonthly: 55,
        calculatedSavings: 280,
        provisionExpected: 90,
        aiConfidence: 99,
        status: 'neu',
        notes: 'SF 12, Vollkasko, Zweitwagenrabatt berücksichtigt.',
      },
      {
        id: 'lead-4',
        date: '05.10.2026',
        clientName: 'Familie Reinhardt',
        clientEmail: 'reinhardt.leipzig@t-online.de',
        clientPhone: '+49 160 8899001',
        service: 'internet',
        currentProvider: 'Vodafone DSL 50',
        annualKwh: 0,
        currentMonthly: 44.90,
        currentAnnual: 538,
        bestOfferName: 'Glasfaser Highspeed 250 Mbit/s',
        bestOfferProvider: 'Telekom Deutschland',
        bestOfferAnnual: 358,
        bestOfferMonthly: 29.90,
        calculatedSavings: 180,
        provisionExpected: 50,
        aiConfidence: 95,
        status: 'neu',
        notes: 'Glasfaser-Anschlussdose in Rotfuchsstraße bereits betriebsbereit.',
      },
    ];
  });

  // 2. Aktiver Kundenbestand & Vertragslaufzeit-Monitor (Lifecycle & Fristen-Wächter)
  const [contracts, setContracts] = useState<ContractRecord[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_active_contracts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'ct-101',
        clientName: 'Klaus Ebersbach',
        clientPhone: '+49 174 5544332',
        clientEmail: 'klaus.ebersbach@web.de',
        service: 'gas',
        provider: 'E.ON Gas',
        tariffName: 'E.ON Erdgas 24M Festpreis',
        meterNumber: 'GAS-04329-1102',
        annualKwh: 14500,
        currentMonthlyInstallment: 110,
        startDate: '2025-11-15',
        durationMonths: 12,
        noticePeriodDays: 30,
        endDate: '2026-11-15',
        status: 'critical_cancellation', // Kündigungsfrist naht in ~38 Tagen!
        provision: 80,
        accountingInvoiceId: 'RE-2025-118',
        accountingStatus: 'ausgezahlt',
        safeInstallmentRecommended: 112,
        backpaymentRisk: -24, // sicher
        nextBestOffer: {
          provider: 'EnBW Energie',
          tariff: 'EnBW Gas Natur 2026',
          newMonthly: 98,
          newAnnual: 1176,
          savingsPerYear: 144,
        },
      },
      {
        id: 'ct-102',
        clientName: 'Merve Aydin',
        clientPhone: '+49 178 1122334',
        clientEmail: 'merve.aydin@gmail.com',
        service: 'strom',
        provider: 'Vattenfall',
        tariffName: 'Vattenfall Natur 12',
        meterNumber: 'STR-04109-7723',
        annualKwh: 4200,
        currentMonthlyInstallment: 105,
        startDate: '2026-01-01',
        durationMonths: 12,
        noticePeriodDays: 30,
        endDate: '2026-12-31',
        status: 'warning_renewal', // Endet in ~84 Tagen
        provision: 65,
        accountingInvoiceId: 'RE-2026-003',
        accountingStatus: 'ausgezahlt',
        safeInstallmentRecommended: 104,
        backpaymentRisk: +12,
        nextBestOffer: {
          provider: 'Yello Strom',
          tariff: 'Yello Strom Klima Plus',
          newMonthly: 94,
          newAnnual: 1128,
          savingsPerYear: 132,
        },
      },
      {
        id: 'ct-103',
        clientName: 'Jens Brauer',
        clientPhone: '+49 172 3344556',
        clientEmail: 'j.brauer@leipzig-mail.de',
        service: 'strom',
        provider: 'Maingau Energie',
        tariffName: 'Maingau Strom Clever',
        meterNumber: 'STR-04315-9921',
        annualKwh: 2900,
        currentMonthlyInstallment: 72,
        startDate: '2026-04-01',
        durationMonths: 24,
        noticePeriodDays: 30,
        endDate: '2028-04-01',
        status: 'active', // noch lange aktiv
        provision: 65,
        accountingInvoiceId: 'RE-2026-041',
        accountingStatus: 'ausgezahlt',
        safeInstallmentRecommended: 74,
        backpaymentRisk: -15,
      },
      {
        id: 'ct-104',
        clientName: 'Dr. Annette Richter',
        clientPhone: '+49 170 9988776',
        clientEmail: 'richter.praxis@arcor.de',
        service: 'gas',
        provider: 'Montana Energie',
        tariffName: 'Montana Erdgas Fix',
        meterNumber: 'GAS-04105-3391',
        annualKwh: 26000,
        currentMonthlyInstallment: 180,
        startDate: '2026-06-15',
        durationMonths: 12,
        noticePeriodDays: 30,
        endDate: '2027-06-15',
        status: 'active',
        provision: 80,
        accountingInvoiceId: 'RE-2026-062',
        accountingStatus: 'ausgezahlt',
        safeInstallmentRecommended: 194,
        backpaymentRisk: +168, // Nachzahlungsgefahr!
      },
    ];
  });

  // 2.5 CRM Kundenkontakte & Optimierungsprozesse State
  const [crmContacts, setCrmContacts] = useState<CustomerContact[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_crm_contacts');
      if (saved) {
        const parsed: CustomerContact[] = JSON.parse(saved);
        return parsed.map((c) => ({
          ...c,
          noteEntries: c.noteEntries || []
        }));
      }
    } catch (e) {}
    return [
      {
        id: 'kd-1',
        customerNumber: 'KD-2026-001',
        fullName: 'Klaus Ebersbach',
        phone: '+49 174 5544332',
        email: 'klaus.ebersbach@web.de',
        address: 'Wurzner Str. 42',
        city: 'Leipzig',
        postalCode: '04315',
        preferredContact: 'telefon',
        customerSince: '15.11.2025',
        tags: ['Stammkunde', 'Gas-Heizung', 'Leipzig-Ost'],
        contracts: [
          {
            id: 'ct-101',
            clientName: 'Klaus Ebersbach',
            clientPhone: '+49 174 5544332',
            clientEmail: 'klaus.ebersbach@web.de',
            service: 'gas',
            provider: 'E.ON Gas',
            tariffName: 'E.ON Erdgas 24M Festpreis',
            meterNumber: 'GAS-04329-1102',
            annualKwh: 14500,
            currentMonthlyInstallment: 110,
            startDate: '2025-11-15',
            durationMonths: 12,
            noticePeriodDays: 30,
            endDate: '2026-11-15',
            status: 'critical_cancellation',
            provision: 80,
            accountingInvoiceId: 'RE-2025-118',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 112,
            backpaymentRisk: -24,
            nextBestOffer: {
              provider: 'EnBW Energie',
              tariff: 'EnBW Gas Natur 2026',
              newMonthly: 98,
              newAnnual: 1176,
              savingsPerYear: 144,
            },
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-101',
            service: 'gas',
            stage: 'angebot_versendet',
            currentProvider: 'E.ON Gas (Altvertrag)',
            targetProvider: 'EnBW Energie',
            targetTariff: 'EnBW Gas Natur 2026',
            potentialAnnualSavings: 144,
            currentMonthlyInstallment: 110,
            projectedMonthlyInstallment: 98,
            startedDate: '01.10.2026',
            lastUpdatedDate: '07.10.2026',
            notes: 'Kündigungsfrist naht in ~38 Tagen! Folge-Angebot EnBW Gas Natur vorgelegt. Kunde prüft Unterlagen.',
          }
        ],
        notes: 'Sehr zuverlässiger Stammkunde. Hat Gas-Vertrag, Kündigungsfrist naht in ~38 Tagen. Folgeangebot vorab versendet.',
        noteEntries: [
          {
            id: 'note-101-1',
            date: '07.10.2026, 11:20 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Kündigungsfrist & EnBW Folge-Angebot besprochen',
            content: 'Mit Herrn Ebersbach telefoniert: Kündigungsfrist zum 15.11.2026 rückt näher. Angebot für EnBW Gas Natur (98 €/Monat, Ersparnis +144 €/Jahr) per E-Mail zugestellt. Kunde prüft Unterlagen am Wochenende.',
            actionRequired: true,
            actionDone: false,
            followUpDate: '12.10.2026',
            pinned: true,
          },
          {
            id: 'note-101-2',
            date: '02.10.2026, 09:45 Uhr',
            type: 'whatsapp',
            author: 'Daryos Kreis',
            title: 'Zählerstand & Nachzahlungs-Check',
            content: 'Kunde hat Foto von Gaszähler GAS-04329-1102 über WhatsApp gesendet (Stand: 14.500 kWh). Nachzahlungsrisiko mit 110 € Abschlag durchgerechnet: Im grünen Bereich (-24 € Guthaben erwartet).',
            actionRequired: false,
            actionDone: true,
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 144,
        status: 'in_optimierung'
      },
      {
        id: 'kd-2',
        customerNumber: 'KD-2026-002',
        fullName: 'Merve Aydin',
        phone: '+49 178 1122334',
        email: 'merve.aydin@gmail.com',
        address: 'Karl-Liebknecht-Str. 89',
        city: 'Leipzig',
        postalCode: '04275',
        preferredContact: 'whatsapp',
        customerSince: '01.01.2026',
        tags: ['Ökostrom', 'Südvorstadt'],
        contracts: [
          {
            id: 'ct-102',
            clientName: 'Merve Aydin',
            clientPhone: '+49 178 1122334',
            clientEmail: 'merve.aydin@gmail.com',
            service: 'strom',
            provider: 'Vattenfall',
            tariffName: 'Vattenfall Natur 12',
            meterNumber: 'STR-04109-7723',
            annualKwh: 4200,
            currentMonthlyInstallment: 105,
            startDate: '2026-01-01',
            durationMonths: 12,
            noticePeriodDays: 30,
            endDate: '2026-12-31',
            status: 'warning_renewal',
            provision: 65,
            accountingInvoiceId: 'RE-2026-003',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 104,
            backpaymentRisk: 12,
            nextBestOffer: {
              provider: 'Yello Strom',
              tariff: 'Yello Strom Klima Plus',
              newMonthly: 94,
              newAnnual: 1128,
              savingsPerYear: 132,
            },
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-102',
            service: 'strom',
            stage: 'tarif_vergleich',
            currentProvider: 'Vattenfall Natur 12',
            targetProvider: 'Yello Strom',
            targetTariff: 'Yello Strom Klima Plus',
            potentialAnnualSavings: 132,
            currentMonthlyInstallment: 105,
            projectedMonthlyInstallment: 94,
            startedDate: '05.10.2026',
            lastUpdatedDate: '08.10.2026',
            notes: 'Laufzeit endet zum Jahreswechsel. Vergleich zu Yello Klima Plus berechnet. Wartet auf Kundenfreigabe.',
          }
        ],
        notes: 'Bevorzugt Kommunikation via WhatsApp. Ökostrom-Option wichtig.',
        noteEntries: [
          {
            id: 'note-102-1',
            date: '08.10.2026, 10:15 Uhr',
            type: 'whatsapp',
            author: 'Daryos Kreis',
            title: 'Ökostrom-Option gewünscht · Yello Angebot gesendet',
            content: 'Frau Aydin hat per WhatsApp geschrieben: Ausdrücklicher Wunsch nach 100% Ökostrom. Tarifangebot Yello Strom Klima Plus (94 €/M., -132 €/Jahr) geteilt. Kundin prüft heute Abend.',
            actionRequired: false,
            actionDone: true,
            pinned: true,
          },
          {
            id: 'note-102-2',
            date: '05.10.2026, 16:30 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Erstberatung nach Umzug in die Südvorstadt',
            content: 'Telefonische Aufnahme der Verbrauchsdaten (4.200 kWh). Laufzeit bei Vattenfall endet zum 31.12.2026. Fristgerechte Wechselvorbereitung zugesagt.',
            actionRequired: false,
            actionDone: true,
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 132,
        status: 'in_optimierung'
      },
      {
        id: 'kd-3',
        customerNumber: 'KD-2026-003',
        fullName: 'Jens Brauer',
        phone: '+49 172 3344556',
        email: 'j.brauer@leipzig-mail.de',
        address: 'Zweinaundorfer Str. 14',
        city: 'Leipzig',
        postalCode: '04318',
        preferredContact: 'telefon',
        customerSince: '01.04.2026',
        tags: ['Stammkunde', 'Langzeitgarantie'],
        contracts: [
          {
            id: 'ct-103',
            clientName: 'Jens Brauer',
            clientPhone: '+49 172 3344556',
            clientEmail: 'j.brauer@leipzig-mail.de',
            service: 'strom',
            provider: 'Maingau Energie',
            tariffName: 'Maingau Strom Clever',
            meterNumber: 'STR-04315-9921',
            annualKwh: 2900,
            currentMonthlyInstallment: 72,
            startDate: '2026-04-01',
            durationMonths: 24,
            noticePeriodDays: 30,
            endDate: '2028-04-01',
            status: 'active',
            provision: 65,
            accountingInvoiceId: 'RE-2026-041',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 74,
            backpaymentRisk: -15,
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-103',
            service: 'strom',
            stage: 'erfolgreich_aktiv',
            currentProvider: 'Stadtwerke Leipzig (alt)',
            targetProvider: 'Maingau Energie',
            targetTariff: 'Maingau Strom Clever',
            potentialAnnualSavings: 280,
            currentMonthlyInstallment: 72,
            startedDate: '15.03.2026',
            lastUpdatedDate: '01.04.2026',
            notes: 'Wechsel erfolgreich abgeschlossen. 24 Monate Preisgarantie bis 2028 gesichert.',
          }
        ],
        notes: 'Sehr zufrieden mit Wechsel. Nachzahlungs-Schutz aktiviert, keine Nachzahlung zu erwarten.',
        noteEntries: [
          {
            id: 'note-103-1',
            date: '01.04.2026, 14:00 Uhr',
            type: 'beratung_vor_ort',
            author: 'Daryos Kreis',
            title: 'Vor-Ort Vertragsabschluss & Lieferbeginn',
            content: 'Persönlicher Termin in Leipzig: Vertrag Maingau Strom Clever mit 24 Monaten Preisgarantie unterzeichnet. Kündigungsbestätigung des Altversorgers liegt vor.',
            actionRequired: false,
            actionDone: true,
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 280,
        status: 'aktiv'
      },
      {
        id: 'kd-4',
        customerNumber: 'KD-2026-004',
        fullName: 'Dr. Annette Richter',
        phone: '+49 170 9988776',
        email: 'richter.praxis@arcor.de',
        address: 'Gohliser Str. 22',
        city: 'Leipzig',
        postalCode: '04155',
        preferredContact: 'vor-ort',
        customerSince: '15.06.2026',
        tags: ['Gewerbe / Praxis', 'Gohlis', 'Hoher Verbrauch'],
        contracts: [
          {
            id: 'ct-104',
            clientName: 'Dr. Annette Richter',
            clientPhone: '+49 170 9988776',
            clientEmail: 'richter.praxis@arcor.de',
            service: 'gas',
            provider: 'Montana Energie',
            tariffName: 'Montana Erdgas Fix',
            meterNumber: 'GAS-04105-3391',
            annualKwh: 26000,
            currentMonthlyInstallment: 180,
            startDate: '2026-06-15',
            durationMonths: 12,
            noticePeriodDays: 30,
            endDate: '2027-06-15',
            status: 'active',
            provision: 80,
            accountingInvoiceId: 'RE-2026-062',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 194,
            backpaymentRisk: 168,
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-104',
            service: 'gas',
            stage: 'erfolgreich_aktiv',
            currentProvider: 'Mitgas Grundversorgung',
            targetProvider: 'Montana Energie',
            targetTariff: 'Montana Erdgas Fix',
            potentialAnnualSavings: 620,
            currentMonthlyInstallment: 180,
            startedDate: '01.06.2026',
            lastUpdatedDate: '15.06.2026',
            notes: 'Praxisräume in Gohlis umgestellt. Jährliche Ersparnis über 600 € realisiert.',
          }
        ],
        notes: 'Praxis in Gohlis. Abschlag sollte auf 194 € angehoben werden (Nachzahlungs-Check empfohlen).',
        noteEntries: [
          {
            id: 'note-104-1',
            date: '06.10.2026, 09:00 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Daryos Nachzahlungs-Schutz: Abschlag erhöhen',
            content: 'Frau Dr. Richter kontaktiert: Durch höheren Gasverbrauch (26.000 kWh in Praxisräumen) droht bei unverändertem Abschlag von 180 € eine Nachzahlung von ca. +168 €. Empfehlung zur Erhöhung auf 194 € ausgesprochen.',
            actionRequired: true,
            actionDone: false,
            followUpDate: '15.10.2026',
            pinned: true,
          }
        ],
        totalAnnualSavingsCalculated: 620,
        status: 'aktiv'
      },
      {
        id: 'kd-5',
        customerNumber: 'KD-2026-005',
        fullName: 'Michael Weber',
        phone: '+49 176 98765432',
        email: 'm.weber.leipzig@web.de',
        address: 'Torgauer Str. 110',
        city: 'Leipzig',
        postalCode: '04315',
        preferredContact: 'whatsapp',
        customerSince: '08.10.2026',
        tags: ['Neukunde', 'Grundversorgung Stadtwerke', 'Gas'],
        contracts: [],
        optimizationProcesses: [
          {
            id: 'proc-105',
            service: 'gas',
            stage: 'dokumenten_pruefung',
            currentProvider: 'Stadtwerke Leipzig (Grundversorgung)',
            targetProvider: 'E.ON Energie Deutschland',
            targetTariff: 'Daryos Gas-Garant 24M (Öko)',
            potentialAnnualSavings: 540,
            currentMonthlyInstallment: 155,
            projectedMonthlyInstallment: 110,
            startedDate: '08.10.2026',
            lastUpdatedDate: '08.10.2026',
            notes: 'Alte Stadtwerke-Rechnung übermittelt. KI hat 18.000 kWh erkannt. Wechsel spart 540 €!',
          }
        ],
        notes: 'Zähler GAS-04329-8812. Wartet auf Vollmacht zur Kündigung der teuren Stadtwerke-Grundversorgung.',
        noteEntries: [
          {
            id: 'note-105-1',
            date: '08.10.2026, 08:30 Uhr',
            type: 'notiz',
            author: 'Daryos Kreis',
            title: 'KI-Rechnungsanalyse: Teure Grundversorgung',
            content: 'Eingereichte Stadtwerke-Abrechnung durch KI gescannt. Arbeitspreis viel zu hoch. Wechsel zu E.ON Gas-Garant spart 540 €/Jahr. Kündigungsvollmacht per WhatsApp angefordert.',
            actionRequired: true,
            actionDone: false,
            followUpDate: '09.10.2026',
            pinned: true,
          }
        ],
        totalAnnualSavingsCalculated: 540,
        status: 'in_optimierung'
      },
      {
        id: 'kd-6',
        customerNumber: 'KD-2026-006',
        fullName: 'Sabine Hoffmann',
        phone: '+49 152 12345678',
        email: 'sabine.hoffmann@gmx.de',
        address: 'Riesaer Str. 55',
        city: 'Leipzig',
        postalCode: '04328',
        preferredContact: 'telefon',
        customerSince: '07.10.2026',
        tags: ['Neukunde', 'Paunsdorf', 'Strom'],
        contracts: [],
        optimizationProcesses: [
          {
            id: 'proc-106',
            service: 'strom',
            stage: 'angebot_versendet',
            currentProvider: 'Vattenfall Easy',
            targetProvider: 'Yello Strom',
            targetTariff: 'Daryos Grünstrom 12M',
            potentialAnnualSavings: 379,
            currentMonthlyInstallment: 118,
            projectedMonthlyInstallment: 86,
            startedDate: '07.10.2026',
            lastUpdatedDate: '08.10.2026',
            notes: 'Angebot per E-Mail versendet. Kunde möchte nach Feierabend anrufen.',
          }
        ],
        notes: 'Umzug nach Paunsdorf. Zähler STR-99214-4401.',
        noteEntries: [
          {
            id: 'note-106-1',
            date: '07.10.2026, 17:40 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Telefonische Angebotsbesprechung nach Feierabend',
            content: 'Frau Hoffmann telefonisch erreicht. Grünstrom-Angebot (86 €/M.) gefällt ihr sehr gut. Kündigung von Vattenfall soll durch uns durchgeführt werden. Vollmacht wird morgen per Mail geschickt.',
            actionRequired: true,
            actionDone: false,
            followUpDate: '09.10.2026',
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 379,
        status: 'in_optimierung'
      },
      {
        id: 'kd-7',
        customerNumber: 'KD-2026-007',
        fullName: 'Markus Schmidt',
        phone: '+49 171 4455667',
        email: 'm.schmidt.leipzig@t-online.de',
        address: 'Eisenbahnstraße 102',
        city: 'Leipzig',
        postalCode: '04315',
        preferredContact: 'telefon',
        customerSince: '12.02.2026',
        tags: ['Home-Office', 'Glasfaser-Ausbau', 'Internet & DSL'],
        contracts: [
          {
            id: 'ct-107',
            clientName: 'Markus Schmidt',
            clientPhone: '+49 171 4455667',
            clientEmail: 'm.schmidt.leipzig@t-online.de',
            service: 'internet',
            provider: 'Telekom Deutschland',
            tariffName: 'MagentaZuhause XL (250 MBit/s)',
            meterNumber: 'DSL-LINE-04315-881',
            currentMonthlyInstallment: 54,
            startDate: '2026-02-15',
            durationMonths: 24,
            noticePeriodDays: 30,
            endDate: '2028-02-15',
            status: 'active',
            provision: 75,
            accountingInvoiceId: 'RE-2026-029',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 54,
            backpaymentRisk: 0,
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-107',
            service: 'internet',
            stage: 'erfolgreich_aktiv',
            currentProvider: 'Vodafone Kabel (Alt)',
            targetProvider: 'Telekom Deutschland',
            targetTariff: 'MagentaZuhause XL (250 MBit/s)',
            potentialAnnualSavings: 180,
            currentMonthlyInstallment: 54,
            startedDate: '01.02.2026',
            lastUpdatedDate: '15.02.2026',
            notes: 'Wechsel zu Telekom Glasfaser vollzogen. Stabile Leitung fürs Home-Office garantiert.',
          }
        ],
        notes: 'Selbstständiger Softwareentwickler. Sehr wichtiger Internetanschluss.',
        noteEntries: [
          {
            id: 'note-107-1',
            date: '15.02.2026, 11:00 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Schaltung Telekom Internet erfolgreich',
            content: 'Router geschaltet, Bandbreite mit 250 MBit/s stabil. Altvertrag bei Vodafone rechtzeitig gekündigt.',
            actionRequired: false,
            actionDone: true,
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 180,
        status: 'aktiv'
      },
      {
        id: 'kd-8',
        customerNumber: 'KD-2026-008',
        fullName: 'Familie Demir',
        phone: '+49 173 8899001',
        email: 'demir.familie@gmail.com',
        address: 'Bornaische Str. 42',
        city: 'Leipzig',
        postalCode: '04277',
        preferredContact: 'whatsapp',
        customerSince: '20.03.2026',
        tags: ['Kombi-Kunde', 'Strom & Gas', 'Connewitz', 'Familie'],
        contracts: [
          {
            id: 'ct-108-strom',
            clientName: 'Familie Demir',
            clientPhone: '+49 173 8899001',
            clientEmail: 'demir.familie@gmail.com',
            service: 'strom',
            provider: 'E.ON Energie Deutschland',
            tariffName: 'E.ON Strom Öko 24',
            meterNumber: 'STR-04277-5510',
            annualKwh: 4800,
            currentMonthlyInstallment: 115,
            startDate: '2026-03-20',
            durationMonths: 24,
            noticePeriodDays: 30,
            endDate: '2028-03-20',
            status: 'active',
            provision: 70,
            accountingInvoiceId: 'RE-2026-035',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 115,
            backpaymentRisk: 0,
          },
          {
            id: 'ct-108-gas',
            clientName: 'Familie Demir',
            clientPhone: '+49 173 8899001',
            clientEmail: 'demir.familie@gmail.com',
            service: 'gas',
            provider: 'EnBW Energie',
            tariffName: 'EnBW Gas Komfort 12M',
            meterNumber: 'GAS-04277-2290',
            annualKwh: 22000,
            currentMonthlyInstallment: 145,
            startDate: '2026-03-20',
            durationMonths: 12,
            noticePeriodDays: 30,
            endDate: '2027-03-20',
            status: 'active',
            provision: 85,
            accountingInvoiceId: 'RE-2026-036',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 148,
            backpaymentRisk: 36,
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-108',
            service: 'gas',
            stage: 'erfolgreich_aktiv',
            currentProvider: 'Stadtwerke Leipzig (Alt)',
            targetProvider: 'EnBW Energie',
            targetTariff: 'EnBW Gas Komfort 12M',
            potentialAnnualSavings: 490,
            currentMonthlyInstallment: 145,
            startedDate: '01.03.2026',
            lastUpdatedDate: '20.03.2026',
            notes: 'Kombi-Optimierung für Strom und Gas gleichzeitig abgewickelt. Gesamtersparnis ca. 730 €/Jahr!',
          }
        ],
        notes: 'Große Wohnung in Connewitz. Haben sowohl Strom als auch Gas über uns optimiert.',
        noteEntries: [
          {
            id: 'note-108-1',
            date: '20.03.2026, 15:30 Uhr',
            type: 'beratung_vor_ort',
            author: 'Daryos Kreis',
            title: 'Kombi-Abschluss Strom & Gas Connewitz',
            content: 'Termin vor Ort: Beide Zähler (Strom STR-04277-5510 & Gas GAS-04277-2290) abgelesen. Kombi-Vertrag mit E.ON und EnBW erfolgreich unter Dach und Fach.',
            actionRequired: false,
            actionDone: true,
            pinned: true,
          }
        ],
        totalAnnualSavingsCalculated: 730,
        status: 'aktiv'
      },
      {
        id: 'kd-9',
        customerNumber: 'KD-2026-009',
        fullName: 'Krause Logistik & Fuhrpark GmbH',
        phone: '+49 175 6677889',
        email: 'fuhrpark@krause-logistik.de',
        address: 'Plautstraße 48',
        city: 'Leipzig',
        postalCode: '04179',
        preferredContact: 'telefon',
        customerSince: '18.05.2026',
        tags: ['Gewerbe / Flotte', 'KFZ & Flotte', 'Leipzig-West'],
        contracts: [
          {
            id: 'ct-109',
            clientName: 'Krause Logistik & Fuhrpark GmbH',
            clientPhone: '+49 175 6677889',
            clientEmail: 'fuhrpark@krause-logistik.de',
            service: 'kfz',
            provider: 'VHV Versicherungen',
            tariffName: 'VHV FlottenSchutz Gewerbe Plus',
            meterNumber: 'KFZ-L-KL-2026',
            currentMonthlyInstallment: 380,
            startDate: '2026-05-18',
            durationMonths: 12,
            noticePeriodDays: 30,
            endDate: '2027-05-18',
            status: 'active',
            provision: 140,
            accountingInvoiceId: 'RE-2026-052',
            accountingStatus: 'ausgezahlt',
            safeInstallmentRecommended: 380,
            backpaymentRisk: 0,
          }
        ],
        optimizationProcesses: [
          {
            id: 'proc-109',
            service: 'kfz',
            stage: 'erfolgreich_aktiv',
            currentProvider: 'Allianz Gewerbe (Alt)',
            targetProvider: 'VHV Versicherungen',
            targetTariff: 'VHV FlottenSchutz Gewerbe Plus',
            potentialAnnualSavings: 860,
            currentMonthlyInstallment: 380,
            startedDate: '01.05.2026',
            lastUpdatedDate: '18.05.2026',
            notes: 'Fuhrpark mit 6 Transportern optimiert. Jährliche Ersparnis 860 €!',
          }
        ],
        notes: 'Ansprechpartner Herr Krause. Fuhrparkleiter.',
        noteEntries: [
          {
            id: 'note-109-1',
            date: '18.05.2026, 10:15 Uhr',
            type: 'telefonat',
            author: 'Daryos Kreis',
            title: 'Flottenoptimierung erfolgreich umgestellt',
            content: 'Fuhrparkverträge auf VHV FlottenSchutz umgestellt. Flottenrabatt aktiviert. Wiedervorlage für April 2027 hinterlegt.',
            actionRequired: false,
            actionDone: true,
            pinned: false,
          }
        ],
        totalAnnualSavingsCalculated: 860,
        status: 'aktiv'
      }
    ];
  });

  // 2.6 Kunden-Meldungen State
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_customer_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'msg-1',
        date: '09.10.2026',
        time: '09:42 Uhr',
        customerName: 'Klaus Ebersbach',
        customerEmail: 'klaus.ebersbach@web.de',
        customerPhone: '+49 174 5544332',
        type: 'rechnung_upload',
        title: 'Neue Stadtwerke-Jahresrechnung eingegangen',
        message: 'Guten Tag Herr Kreis, habe die neue Jahresabrechnung der Stadtwerke Leipzig mit 148 € Nachforderung erhalten. Bitte prüfen, ob wir vor Ablauf der Frist zu Yello wechseln können.',
        service: 'strom',
        status: 'neu',
        priority: 'dringend'
      },
      {
        id: 'msg-2',
        date: '08.10.2026',
        time: '16:15 Uhr',
        customerName: 'Dr. Annette Richter',
        customerEmail: 'richter.praxis@arcor.de',
        customerPhone: '+49 170 9988776',
        type: 'rueckruf',
        title: 'Rückrufbitte wegen Preisanpassung Gas',
        message: 'Bitte um einen kurzen Anruf bezüglich der angekündigten Erhöhung des Arbeitspreises für meine Praxisräume in Leipzig-Gohlis.',
        service: 'gas',
        status: 'in_bearbeitung',
        priority: 'normal'
      },
      {
        id: 'msg-3',
        date: '08.10.2026',
        time: '11:20 Uhr',
        customerName: 'Markus Schmidt',
        customerEmail: 'markus.schmidt.le@gmail.com',
        customerPhone: '+49 176 1122334',
        type: 'tarif_pruefung',
        title: 'Glasfaser-Verfügbarkeit Leipzig-Ost',
        message: 'Hallo Herr Kreis, mein alter Vodafone DSL-Vertrag läuft im November aus. Haben Sie das Telekom Glasfaser-Angebot mit 250 Mbit/s schon vorbereitet?',
        service: 'internet',
        status: 'neu',
        priority: 'normal'
      },
      {
        id: 'msg-4',
        date: '07.10.2026',
        time: '14:05 Uhr',
        customerName: 'Familie Demir',
        customerEmail: 'demir.familie@gmail.com',
        customerPhone: '+49 173 8899001',
        type: 'frage',
        title: 'Status Wechselauftrag Vattenfall',
        message: 'Wollten nachfragen, ob die Kündigungsbestätigung der Stadtwerke für Gas schon eingegangen ist.',
        service: 'gas',
        status: 'in_bearbeitung',
        priority: 'normal'
      },
      {
        id: 'msg-5',
        date: '05.10.2026',
        time: '10:30 Uhr',
        customerName: 'Jens Brauer',
        customerEmail: 'j.brauer@leipzig-mail.de',
        customerPhone: '+49 172 3344556',
        type: 'kuendigung',
        title: 'Kündigungsbestätigung eingetroffen',
        message: 'Kündigungsbestätigung ist heute per Post eingetroffen. Ersparnis wie besprochen ca. 379 €/Jahr. Vielen Dank für die Vermittlung!',
        service: 'strom',
        status: 'erledigt',
        priority: 'normal'
      }
    ];
  });

  // 2.7 Optimierungsprojekte State
  const [optimizationProjects, setOptimizationProjects] = useState<OptimizationProject[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'prj-101',
        projectNumber: 'PRJ-2026-041',
        customerName: 'Klaus Ebersbach',
        customerPhone: '+49 174 5544332',
        customerEmail: 'klaus.ebersbach@web.de',
        service: 'strom',
        title: 'Stromoptimierung Stadtwerke -> Yello Klima Plus',
        currentProvider: 'Stadtwerke Leipzig (Grundversorgung)',
        targetProvider: 'Yello Strom',
        stage: '3_angebot',
        stageLabel: '3. Angebot versendet',
        progressPercent: 60,
        annualSavingsTarget: 379,
        deadlineDate: '28.10.2026',
        assignedAdvisor: 'Daryos Kreis',
        status: 'in_bearbeitung',
        lastAction: 'Kalkulation & Angebot per E-Mail vorgelegt'
      },
      {
        id: 'prj-102',
        projectNumber: 'PRJ-2026-042',
        customerName: 'Dr. Annette Richter',
        customerPhone: '+49 170 9988776',
        customerEmail: 'richter.praxis@arcor.de',
        service: 'gas',
        title: 'Erdgasoptimierung Praxis Montana -> E.ON Fix 24M',
        currentProvider: 'Montana Erdgas Fix',
        targetProvider: 'E.ON Energie Deutschland',
        stage: '2_vergleich',
        stageLabel: '2. Tarifvergleich läuft',
        progressPercent: 40,
        annualSavingsTarget: 540,
        deadlineDate: '15.11.2026',
        assignedAdvisor: 'Daryos Kreis',
        status: 'in_bearbeitung',
        lastAction: '26.000 kWh Lastgangdaten abgeglichen'
      },
      {
        id: 'prj-103',
        projectNumber: 'PRJ-2026-043',
        customerName: 'Markus Schmidt',
        customerPhone: '+49 176 1122334',
        customerEmail: 'markus.schmidt.le@gmail.com',
        service: 'internet',
        title: 'Highspeed-Glasfaser 250 Mbit/s Leipzig-Ost',
        currentProvider: 'Vodafone DSL 50',
        targetProvider: 'Telekom Deutschland',
        stage: '4_auftrag',
        stageLabel: '4. Wechselauftrag erteilt',
        progressPercent: 80,
        annualSavingsTarget: 180,
        deadlineDate: '05.11.2026',
        assignedAdvisor: 'Daryos Kreis',
        status: 'in_bearbeitung',
        lastAction: 'Rufnummern-Portierungsvollmacht unterzeichnet'
      },
      {
        id: 'prj-104',
        projectNumber: 'PRJ-2026-044',
        customerName: 'Familie Demir',
        customerPhone: '+49 173 8899001',
        customerEmail: 'demir.familie@gmail.com',
        service: 'gas',
        title: 'Kombi-Wechsel Strom & Gas zu EnBW',
        currentProvider: 'Stadtwerke Leipzig (Alt)',
        targetProvider: 'EnBW Energie',
        stage: '5_aktiv',
        stageLabel: '5. Zähler aktiv & Ersparnis realisiert',
        progressPercent: 100,
        annualSavingsTarget: 490,
        deadlineDate: '01.10.2026',
        assignedAdvisor: 'Daryos Kreis',
        status: 'erfolgreich',
        lastAction: 'Belieferung aktiv, Provision abgerechnet'
      },
      {
        id: 'prj-105',
        projectNumber: 'PRJ-2026-045',
        customerName: 'Autohaus & Logistik Krause',
        customerPhone: '+49 171 7766554',
        customerEmail: 'krause.logistik@web.de',
        service: 'kfz',
        title: 'Fuhrpark-Versicherungsoptimierung 6 Transporter',
        currentProvider: 'Allianz Gewerbe',
        targetProvider: 'VHV FlottenSchutz',
        stage: '5_aktiv',
        stageLabel: '5. Flotte aktiv versichert',
        progressPercent: 100,
        annualSavingsTarget: 860,
        deadlineDate: '18.05.2026',
        assignedAdvisor: 'Daryos Kreis',
        status: 'erfolgreich',
        lastAction: 'Flottenrabatt wirksam, Jahresersparnis 860 €'
      }
    ];
  });

  // 2.8 Angebote & Tarifvergleiche State
  const [customerOffers, setCustomerOffers] = useState<CustomerOffer[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_offers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'ang-1',
        offerNumber: 'ANG-2026-018',
        date: '08.10.2026',
        validUntil: '24.10.2026',
        customerName: 'Klaus Ebersbach',
        customerEmail: 'klaus.ebersbach@web.de',
        customerPhone: '+49 174 5544332',
        service: 'strom',
        currentProvider: 'Stadtwerke Leipzig (Grundversorgung)',
        currentTariff: 'Basis-Strom Leipzig',
        currentMonthly: 118,
        currentAnnual: 1416,
        recommendedProvider: 'Yello Strom',
        recommendedTariff: 'Yello Strom Klima Plus',
        recommendedMonthly: 86,
        recommendedAnnual: 1037,
        annualSavings: 379,
        guaranteeMonths: 12,
        status: 'versendet',
        notes: 'Preisgarantie 12 Monate, 100% Ökostrom zertifiziert.'
      },
      {
        id: 'ang-2',
        offerNumber: 'ANG-2026-019',
        date: '07.10.2026',
        validUntil: '30.10.2026',
        customerName: 'Dr. Annette Richter',
        customerEmail: 'richter.praxis@arcor.de',
        customerPhone: '+49 170 9988776',
        service: 'gas',
        currentProvider: 'Montana Erdgas Fix',
        currentTariff: 'Standard-Gas 2024',
        currentMonthly: 180,
        currentAnnual: 2160,
        recommendedProvider: 'E.ON Energie Deutschland',
        recommendedTariff: 'E.ON Erdgas Direkt 24M',
        recommendedMonthly: 135,
        recommendedAnnual: 1620,
        annualSavings: 540,
        guaranteeMonths: 24,
        status: 'angenommen',
        notes: '24 Monate volle Energiepreisgarantie für Praxisräume.'
      },
      {
        id: 'ang-3',
        offerNumber: 'ANG-2026-020',
        date: '08.10.2026',
        validUntil: '15.11.2026',
        customerName: 'Markus Schmidt',
        customerEmail: 'markus.schmidt.le@gmail.com',
        customerPhone: '+49 176 1122334',
        service: 'internet',
        currentProvider: 'Vodafone DSL 50',
        currentTariff: 'Red Internet DSL 50',
        currentMonthly: 44.90,
        currentAnnual: 538.80,
        recommendedProvider: 'Telekom Deutschland',
        recommendedTariff: 'MagentaZuhause XL Glasfaser (250 Mbit/s)',
        recommendedMonthly: 29.90,
        recommendedAnnual: 358.80,
        annualSavings: 180,
        guaranteeMonths: 24,
        status: 'entwurf',
        notes: 'Inklusive WLAN-Router Gutschrift und kostenloser Glasfaser-Bereitstellung.'
      },
      {
        id: 'ang-4',
        offerNumber: 'ANG-2026-021',
        date: '06.10.2026',
        validUntil: '20.10.2026',
        customerName: 'Familie Reinhardt',
        customerEmail: 'reinhardt.leipzig@t-online.de',
        customerPhone: '+49 160 8899001',
        service: 'strom',
        currentProvider: 'Vattenfall Easy',
        currentTariff: 'Vattenfall Easy Strom',
        currentMonthly: 96,
        currentAnnual: 1152,
        recommendedProvider: 'Stadtwerke Leipzig',
        recommendedTariff: 'L-Strom bestPreis 12M',
        recommendedMonthly: 74,
        recommendedAnnual: 888,
        annualSavings: 264,
        guaranteeMonths: 12,
        status: 'angenommen',
        notes: 'Regionaltarif mit lokaler Betreuung.'
      }
    ];
  });

  // 2.9 Rechnungen State
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('daryos_invoices');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'inv-1',
        invoiceNumber: 'RE-2026-0038',
        customerName: 'Dr. Annette Richter',
        customerAddress: 'Gohliser Str. 18',
        customerCity: 'Leipzig',
        customerPostalCode: '04105',
        customerEmail: 'richter.praxis@arcor.de',
        customerPhone: '+49 170 9988776',
        invoiceDate: '02.10.2026',
        dueDate: '16.10.2026',
        servicePeriod: 'September 2026',
        taxRate: 19,
        taxType: 'standard_19',
        items: [
          {
            id: 'it-1',
            description: 'Vermittlungsprovision Erdgasoptimierung Praxisräume Montana -> E.ON',
            quantity: 1,
            unitPrice: 80.0,
            total: 80.0
          }
        ],
        subtotal: 80.0,
        taxAmount: 15.20,
        total: 95.20,
        status: 'bezahlt',
        notes: 'Zahlbar innerhalb von 14 Tagen. Betrag dankend erhalten am 04.10.2026.',
        iban: 'DE89 8605 5592 1102 3344 55',
        bic: 'LEIPDEDDXXX',
        bankName: 'Sparkasse Leipzig'
      },
      {
        id: 'inv-2',
        invoiceNumber: 'RE-2026-0039',
        customerName: 'Familie Demir',
        customerAddress: 'Bornaische Str. 55',
        customerCity: 'Leipzig',
        customerPostalCode: '04277',
        customerEmail: 'demir.familie@gmail.com',
        customerPhone: '+49 173 8899001',
        invoiceDate: '05.10.2026',
        dueDate: '19.10.2026',
        servicePeriod: 'Oktober 2026',
        taxRate: 19,
        taxType: 'standard_19',
        items: [
          {
            id: 'it-2',
            description: 'Erfolgsabhängige Provision Tarifwechsel Strom Stadtwerke -> EnBW',
            quantity: 1,
            unitPrice: 65.0,
            total: 65.0
          }
        ],
        subtotal: 65.0,
        taxAmount: 12.35,
        total: 77.35,
        status: 'bezahlt',
        notes: 'Vielen Dank für Ihren Auftrag!',
        iban: 'DE89 8605 5592 1102 3344 55',
        bic: 'LEIPDEDDXXX',
        bankName: 'Sparkasse Leipzig'
      },
      {
        id: 'inv-3',
        invoiceNumber: 'RE-2026-0040',
        customerName: 'Autohaus & Logistik Krause',
        customerAddress: 'Riesaer Str. 80',
        customerCity: 'Leipzig',
        customerPostalCode: '04328',
        customerEmail: 'krause.logistik@web.de',
        customerPhone: '+49 171 7766554',
        invoiceDate: '07.10.2026',
        dueDate: '21.10.2026',
        servicePeriod: 'Oktober 2026',
        taxRate: 19,
        taxType: 'standard_19',
        items: [
          {
            id: 'it-3',
            description: 'Gewerbliche Fuhrpark- und Flottenversicherungsanalyse (6 Transporter)',
            quantity: 1,
            unitPrice: 140.0,
            total: 140.0
          }
        ],
        subtotal: 140.0,
        taxAmount: 26.60,
        total: 166.60,
        status: 'offen',
        notes: 'Zahlbar rein netto bis 21.10.2026.',
        iban: 'DE89 8605 5592 1102 3344 55',
        bic: 'LEIPDEDDXXX',
        bankName: 'Sparkasse Leipzig'
      },
      {
        id: 'inv-4',
        invoiceNumber: 'RE-2026-0041',
        customerName: 'Klaus Ebersbach',
        customerAddress: 'Wurzner Str. 42',
        customerCity: 'Leipzig',
        customerPostalCode: '04315',
        customerEmail: 'klaus.ebersbach@web.de',
        customerPhone: '+49 174 5544332',
        invoiceDate: '08.10.2026',
        dueDate: '22.10.2026',
        servicePeriod: 'Oktober 2026',
        taxRate: 19,
        taxType: 'standard_19',
        items: [
          {
            id: 'it-4',
            description: 'Vermittlungsprovision Wechselservice Strom Stadtwerke -> Yello',
            quantity: 1,
            unitPrice: 65.0,
            total: 65.0
          }
        ],
        subtotal: 65.0,
        taxAmount: 12.35,
        total: 77.35,
        status: 'offen',
        notes: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.',
        iban: 'DE89 8605 5592 1102 3344 55',
        bic: 'LEIPDEDDXXX',
        bankName: 'Sparkasse Leipzig'
      }
    ];
  });

  // 3. Nachzahlungs-Schutz State & Simulator
  const [nzService, setNzService] = useState<ServiceType>('gas');
  const [nzKwh, setNzKwh] = useState<number>(20000);
  const [nzCurrentInstallment, setNzCurrentInstallment] = useState<number>(120);
  const [nzClientName, setNzClientName] = useState<string>('Herr Weber');
  const [nzClientEmail, setNzClientEmail] = useState<string>('m.weber@web.de');
  const [nzClientPhone, setNzClientPhone] = useState<string>('+49 176 98765432');
  const [nzResult, setNzResult] = useState<NachzahlungCalculation | null>(null);

  // Selected lead for detail modal
  const [selectedLead, setSelectedLead] = useState<KiAuditLead | null>(null);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daryos_ki_leads', JSON.stringify(kiLeads));
    } catch (e) {}
  }, [kiLeads]);

  useEffect(() => {
    try {
      localStorage.setItem('daryos_active_contracts', JSON.stringify(contracts));
    } catch (e) {}
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem('daryos_crm_contacts', JSON.stringify(crmContacts));
    } catch (e) {}
  }, [crmContacts]);

  useEffect(() => {
    try {
      localStorage.setItem('daryos_customer_messages', JSON.stringify(customerMessages));
      localStorage.setItem('daryos_projects', JSON.stringify(optimizationProjects));
      localStorage.setItem('daryos_offers', JSON.stringify(customerOffers));
      localStorage.setItem('daryos_invoices', JSON.stringify(invoices));
    } catch (e) {}
  }, [customerMessages, optimizationProjects, customerOffers, invoices]);

  // Messages handlers
  const handleUpdateMessageStatus = (id: string, status: 'neu' | 'in_bearbeitung' | 'erledigt') => {
    setCustomerMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    showNotification(`Meldungs-Status auf "${status}" aktualisiert.`);
  };

  const handleDeleteMessage = (id: string) => {
    setCustomerMessages((prev) => prev.filter((m) => m.id !== id));
    showNotification('Kunden-Meldung gelöscht.');
  };

  // Projects handlers
  const handleUpdateProjectStage = (id: string, stage: OptimizationProject['stage']) => {
    const stageLabels: Record<OptimizationProject['stage'], string> = {
      '1_check': '1. Unterlagen-Check',
      '2_vergleich': '2. Tarifvergleich läuft',
      '3_angebot': '3. Angebot versendet',
      '4_auftrag': '4. Wechselauftrag erteilt',
      '5_aktiv': '5. Zähler aktiv & Ersparnis realisiert'
    };
    const progressMap: Record<OptimizationProject['stage'], number> = {
      '1_check': 20,
      '2_vergleich': 40,
      '3_angebot': 60,
      '4_auftrag': 80,
      '5_aktiv': 100
    };
    setOptimizationProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stage,
              stageLabel: stageLabels[stage],
              progressPercent: progressMap[stage],
              status: stage === '5_aktiv' ? 'erfolgreich' : 'in_bearbeitung',
              lastAction: `Phase manuell auf ${stageLabels[stage]} gesetzt`
            }
          : p
      )
    );
    showNotification(`Projektphase auf ${stageLabels[stage]} aktualisiert.`);
  };

  // Offers handlers
  const handleUpdateOfferStatus = (id: string, status: CustomerOffer['status']) => {
    setCustomerOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    showNotification(`Angebot-Status auf "${status}" aktualisiert.`);
  };

  const handleSendOfferWhatsApp = (offer: CustomerOffer) => {
    const text = `Hallo ${offer.customerName}, hier ist Ihr persönliches Tarifangebot von Daryos®: Wechsel von ${offer.currentProvider} zu ${offer.recommendedProvider} spart Ihnen ${offer.annualSavings.toFixed(0)} € pro Jahr! Neuer monatlicher Abschlag: ${offer.recommendedMonthly.toFixed(2)} €/Monat. Rückfragen gerne hier per WhatsApp!`;
    const cleanPhone = offer.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    showNotification(`Angebot für ${offer.customerName} via WhatsApp geöffnet!`);
  };

  const handleSendOfferEmail = (offer: CustomerOffer) => {
    const subject = `Ihr Daryos® Tarifvergleich (${offer.offerNumber}): ${offer.annualSavings.toFixed(0)} € Ersparnis`;
    const body = `Sehr geehrte(r) ${offer.customerName},\n\nvielen Dank für Ihre Anfrage. Wir haben Ihren Tarif geprüft:\n\nBisheriger Anbieter: ${offer.currentProvider} (${offer.currentMonthly.toFixed(2)} €/Monat)\nEmpfohlener Tarif: ${offer.recommendedProvider} - ${offer.recommendedTariff} (${offer.recommendedMonthly.toFixed(2)} €/Monat)\n\nIhre garantierte jährliche Ersparnis: ${offer.annualSavings.toFixed(0)} EUR / Jahr!\n\nMit freundlichen Grüßen,\nDaryos Kreis\nTarifoptimierung Leipzig`;
    window.location.href = `mailto:${offer.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showNotification(`E-Mail-Entwurf für ${offer.customerName} erstellt.`);
  };

  // Invoices handlers
  const handleSaveInvoice = (newInv: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === newInv.id);
      if (exists) {
        return prev.map((i) => (i.id === newInv.id ? newInv : i));
      }
      return [newInv, ...prev];
    });
    setEditingInvoice(null);
    setActiveTab('rechnungen');
    showNotification(`Rechnung ${newInv.invoiceNumber} erfolgreich verbucht!`);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    showNotification('Rechnung gelöscht.');
  };

  const handleUpdateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    showNotification(`Rechnungsstatus auf "${status}" geändert.`);
  };

  const handleOpenInvoiceCreator = (customerName?: string, service?: ServiceType) => {
    if (customerName) {
      const match = crmContacts.find((c) => c.fullName.toLowerCase().includes(customerName.toLowerCase()));
      setEditingInvoice({
        id: `inv-${Date.now()}`,
        invoiceNumber: `RE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: customerName,
        customerAddress: match?.address || 'Wurzner Str.',
        customerCity: match?.city || 'Leipzig',
        customerPostalCode: match?.postalCode || '04329',
        customerEmail: match?.email || '',
        customerPhone: match?.phone || '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        servicePeriod: 'Oktober 2026',
        taxRate: 19,
        taxType: 'standard_19',
        items: [
          {
            id: '1',
            description: `Vermittlungsprovision & Wechselmanagement ${service ? service.toUpperCase() : 'Tarifwechsel'}`,
            quantity: 1,
            unitPrice: service === 'gas' ? 80.0 : service === 'kfz' ? 90.0 : 65.0,
            total: service === 'gas' ? 80.0 : service === 'kfz' ? 90.0 : 65.0,
          }
        ],
        subtotal: service === 'gas' ? 80.0 : service === 'kfz' ? 90.0 : 65.0,
        taxAmount: service === 'gas' ? 15.20 : service === 'kfz' ? 17.10 : 12.35,
        total: service === 'gas' ? 95.20 : service === 'kfz' ? 107.10 : 77.35,
        status: 'offen',
        notes: 'Zahlbar innerhalb von 14 Tagen ohne Abzug. Vielen Dank für Ihren Auftrag!',
        iban: 'DE89 8605 5592 1102 3344 55',
        bic: 'LEIPDEDDXXX',
        bankName: 'Sparkasse Leipzig'
      });
    } else {
      setEditingInvoice(null);
    }
    setActiveTab('rechnung_erstellen');
  };

  const handleDownloadInvoicePDF = (inv: Invoice) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, 16, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('D', margin + 2.7, 21.5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text('Daryos', margin + 12, 22.5);
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text('(R)', margin + 30, 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Tarifoptimierung & Wechselservice Leipzig', margin + 12, 27);

    doc.text('Daryos Kreis', pageWidth - margin, 18, { align: 'right' });
    doc.text('Rotfuchsstraße 1, 04329 Leipzig', pageWidth - margin, 22, { align: 'right' });
    doc.text('daryos.kreis@gmail.com', pageWidth - margin, 26, { align: 'right' });
    doc.text('USt-IdNr.: DE 345 889 102', pageWidth - margin, 30, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 35, pageWidth - margin, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.customerName, margin, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(inv.customerAddress, margin, 53);
    doc.text(`${inv.customerPostalCode} ${inv.customerCity}`, margin, 58);

    const metaX = pageWidth - margin - 45;
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Rechnungs-Nr.:', metaX, 48);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(inv.invoiceNumber, pageWidth - margin, 48, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Datum:', metaX, 53);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.invoiceDate, pageWidth - margin, 53, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Fällig am:', metaX, 58);
    doc.setTextColor(15, 23, 42);
    doc.text(inv.dueDate, pageWidth - margin, 58, { align: 'right' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('RECHNUNG', margin, 74);

    let y = 82;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Pos.', margin + 2, y + 4.8);
    doc.text('Leistungsbeschreibung', margin + 14, y + 4.8);
    doc.text('Menge', margin + 105, y + 4.8);
    doc.text('Einzelpreis', margin + 125, y + 4.8);
    doc.text('Gesamtbetrag', pageWidth - margin - 2, y + 4.8, { align: 'right' });

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    inv.items.forEach((it, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
      }
      doc.text(`${idx + 1}`, margin + 2, y + 5.2);
      doc.text(it.description, margin + 14, y + 5.2, { maxWidth: 88 });
      doc.text(`${it.quantity}`, margin + 107, y + 5.2);
      doc.text(`${it.unitPrice.toFixed(2)} EUR`, margin + 125, y + 5.2);
      doc.setFont('helvetica', 'bold');
      doc.text(`${it.total.toFixed(2)} EUR`, pageWidth - margin - 2, y + 5.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    y += 6;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin + 90, y, pageWidth - margin, y);
    y += 5;
    doc.text('Nettobetrag:', margin + 95, y);
    doc.text(`${inv.subtotal.toFixed(2)} EUR`, pageWidth - margin - 2, y, { align: 'right' });

    y += 5;
    doc.text(`USt. (${inv.taxRate}%):`, margin + 95, y);
    doc.text(`${inv.taxAmount.toFixed(2)} EUR`, pageWidth - margin - 2, y, { align: 'right' });

    y += 6;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 90, y - 4, pageWidth - margin - 90, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text('Gesamtbetrag:', margin + 95, y + 1.5);
    doc.text(`${inv.total.toFixed(2)} EUR`, pageWidth - margin - 2, y + 1.5, { align: 'right' });

    y += 20;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Zahlungsinformationen & Bankverbindung:', margin + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Bank: ${inv.bankName} · IBAN: ${inv.iban} · BIC: ${inv.bic}`, margin + 4, y + 10.5);
    doc.text(`Verwendungszweck: ${inv.invoiceNumber} - ${inv.customerName}`, margin + 4, y + 15);

    doc.save(`${inv.invoiceNumber}_${inv.customerName.replace(/\s+/g, '_')}.pdf`);
    showNotification(`PDF für Rechnung ${inv.invoiceNumber} heruntergeladen!`);
  };

  const handleUpdateCrmContact = (updated: CustomerContact) => {
    setCrmContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleAddCrmContact = (newContact: CustomerContact) => {
    setCrmContacts((prev) => [newContact, ...prev]);
  };

  const handleDeleteCrmContact = (contactId: string) => {
    setCrmContacts((prev) => prev.filter((c) => c.id !== contactId));
    showNotification('Kundenkontakt gelöscht.');
  };

  const handleOpenNachzahlungFromCrm = (
    clientName: string,
    email: string,
    phone: string,
    service: ServiceType,
    monthly: number,
    kwh?: number
  ) => {
    setNzClientName(clientName);
    setNzClientEmail(email);
    setNzClientPhone(phone);
    setNzService(service);
    setNzCurrentInstallment(monthly);
    if (kwh) setNzKwh(kwh);
    setActiveTab('nachzahlung');
    showNotification(`Nachzahlungs-Schutz für ${clientName} geöffnet!`);
  };

  useEffect(() => {
    setConfig(pricingConfig);
  }, [pricingConfig]);

  // Recalculate Nachzahlungs-Schutz
  useEffect(() => {
    const arbeitspreis = nzService === 'gas' ? config.gasArbeitspreis : config.stromArbeitspreis;
    const grundpreis = nzService === 'gas' ? config.gasGrundpreis : config.stromGrundpreis;
    const expectedAnnual = Math.round((nzKwh * arbeitspreis) / 100 + grundpreis * 12);
    const paidAnnual = Math.round(nzCurrentInstallment * 12);
    const diff = expectedAnnual - paidAnnual; // > 0 means Nachzahlung droht!
    const safeMonthly = Math.ceil(expectedAnnual / 12);

    let riskStatus: 'danger' | 'safe' | 'overpay' = 'safe';
    if (diff > 60) {
      riskStatus = 'danger';
    } else if (diff < -80) {
      riskStatus = 'overpay';
    }

    setNzResult({
      service: nzService,
      annualKwh: nzKwh,
      currentMonthlyPaid: nzCurrentInstallment,
      arbeitspreisCt: arbeitspreis,
      grundpreisMonthly: grundpreis,
      expectedAnnualCost: expectedAnnual,
      paidAnnualTotal: paidAnnual,
      difference: diff,
      recommendedSafeMonthly: safeMonthly,
      riskStatus,
    });
  }, [nzService, nzKwh, nzCurrentInstallment, config]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Eigentümer-Authentifizierung: Passwortprüfung ausschließlich serverseitig (/api/admin/login)
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = await api.admin.login(pinInput);
      onLoginSuccess(user);
      setPinError('');
    } catch (err) {
      setPinError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setPinInput('');
    }
  };

  // Handler: PIN und Eigentümer-E-Mail im System ändern
  const handleSavePinAndEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeSuccess('');
    setPinChangeError('Das Passwort wird serverseitig verwaltet: neuen Hash mit "npm run admin:hash" erzeugen und als ADMIN_PASSWORD_HASH hinterlegen.');
  };

  // Handler für CHECK24 & Makler-Verbindung: Vertrag mit Kunde verbinden
  const handleConnectContractFromBroker = (
    customerId: string,
    newContract: ContractRecord,
    commissionEarned: number
  ) => {
    // 1. In CRM Kontakte hinzufügen & Status aktualisieren
    setCrmContacts((prev) => {
      const updated = prev.map((cust) => {
        if (cust.id !== customerId) return cust;

        const updatedContracts = [newContract, ...cust.contracts];
        const newOptimizationProcess = {
          id: `proc-${Date.now()}`,
          service: newContract.service,
          stage: 'wechsel_eingereicht' as const,
          currentProvider: cust.contracts[0]?.provider || 'Bisheriger Anbieter',
          targetProvider: newContract.provider,
          targetTariff: newContract.tariffName,
          potentialAnnualSavings: Math.max(120, Math.round(newContract.currentMonthlyInstallment * 1.5)),
          currentMonthlyInstallment: cust.contracts[0]?.currentMonthlyInstallment || newContract.currentMonthlyInstallment + 25,
          projectedMonthlyInstallment: newContract.currentMonthlyInstallment,
          startedDate: new Date().toLocaleDateString('de-DE'),
          lastUpdatedDate: new Date().toLocaleDateString('de-DE'),
          notes: `Über CHECK24/Makler-Schnittstelle verbunden: ${newContract.provider} (${newContract.tariffName}). Wechselauftrag eingereicht, Maklerprovision +${commissionEarned} € erfasst.`,
        };

        const newNote = {
          id: `note-${Date.now()}`,
          date: new Date().toLocaleDateString('de-DE') + ', ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
          type: 'notiz' as const,
          author: 'Daryos Makler-System',
          title: `CHECK24-Tarif verbunden: ${newContract.provider} (${newContract.tariffName})`,
          content: `Neuer Vertrag erfolgreich zugeordnet. Abschlag: ${newContract.currentMonthlyInstallment} €/M. Wechsel- & Kündigungsservice via Maklervollmacht eingereicht.`,
          actionRequired: false,
          actionDone: true,
          pinned: true,
        };

        return {
          ...cust,
          status: 'in_optimierung' as const,
          contracts: updatedContracts,
          optimizationProcesses: [newOptimizationProcess, ...cust.optimizationProcesses],
          noteEntries: [newNote, ...(cust.noteEntries || [])],
        };
      });

      try {
        localStorage.setItem('daryos_crm_contacts', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // 2. In Vertragsliste aufnehmen
    setContracts((prev) => {
      const updated = [newContract, ...prev];
      try {
        localStorage.setItem('daryos_contracts', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    showNotification(`✓ Vertrag ${newContract.provider} erfolgreich mit Kunde verbunden & Maklerprovision (+${commissionEarned} €) erfasst!`);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // 1-Klick: Lead-Angebot per E-Mail generieren und versenden
  const handleSendLeadEmail = (lead: KiAuditLead) => {
    const subject = encodeURIComponent(`Ihr optimierter Daryos® Tarifvergleich für ${lead.clientName}`);
    const body = encodeURIComponent(
      `Sehr geehrte(r) Frau/Herr ${lead.clientName},\n\n` +
      `vielen Dank für Ihr Vertrauen in Daryos® – Ihren unabhängigen Tarifoptimierer in Leipzig.\n\n` +
      `Wir haben Ihre Vertragsdaten für ${lead.service.toUpperCase()} automatisiert geprüft und die besten Tarife am Markt verglichen:\n\n` +
      `--------------------------------------------------\n` +
      `ERGEBNIS DES TARIFVERGLEICHS:\n` +
      `• Sparte: ${lead.service.toUpperCase()}\n` +
      `• Bisheriger Versorger: ${lead.currentProvider}\n` +
      `• Bisherige Kosten: ${lead.currentAnnual} € / Jahr (ca. ${lead.currentMonthly} € / Monat)\n` +
      `• Empfohlenes Bestangebot: ${lead.bestOfferName} (${lead.bestOfferProvider})\n` +
      `• Neue Kosten: ${lead.bestOfferAnnual} € / Jahr (ca. ${lead.bestOfferMonthly} € / Monat)\n` +
      `• IHRE GARANTIERTE ERSPARNIS: ${lead.calculatedSavings} € / JAHR!\n` +
      `--------------------------------------------------\n\n` +
      `✓ NACHZAHLUNGS-SCHUTZ: Der monatliche Abschlag ist so berechnet, dass Sie garantiert keine böse Nachzahlung am Jahresende erhalten.\n` +
      `✓ WECHSEL-SERVICE: Wir übernehmen die komplette Kündigung und Ummeldung für Sie – 100% kostenlos und unterbrechungsfrei.\n\n` +
      `Möchten Sie dieses Angebot annehmen? Antworten Sie einfach auf diese E-Mail oder schreiben Sie uns per WhatsApp an +49 176 43416174.\n\n` +
      `Mit freundlichen Grüßen\n` +
      `Daryos Kreis\n` +
      `Rotfuchsstraße 1, 04329 Leipzig\n` +
      `Telefon: +49 176 43416174`
    );

    // Update status in list
    setKiLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'angebot_gesendet' } : l))
    );

    window.location.href = `mailto:${lead.clientEmail}?subject=${subject}&body=${body}`;
    showNotification(`E-Mail-Angebot für ${lead.clientName} erfolgreich generiert!`);
  };

  // 1-Klick: Lead-Angebot per WhatsApp senden
  const handleSendLeadWhatsApp = (lead: KiAuditLead) => {
    const text = encodeURIComponent(
      `Hallo Frau/Herr ${lead.clientName}, hier ist Daryos aus Leipzig! ⚡\n\n` +
      `Wir haben Ihre ${lead.service.toUpperCase()}-Daten geprüft:\n` +
      `Mit dem neuen Besttarif sparen Sie ${lead.calculatedSavings} € pro Jahr (Neuer Abschlag: ca. ${lead.bestOfferMonthly} €/Monat statt bisher ${lead.currentMonthly} €)!\n\n` +
      `Inklusive Daryos Nachzahlungs-Schutz & unterbrechungsfreier Wechselgarantie.\n` +
      `Sollen wir den Wechsel kostenfrei für Sie starten?`
    );
    const cleanPhone = lead.clientPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // 1-Klick: Vertrag vor Kunde gemacht -> Als aktiven Vertrag listen & in Buchhaltung einfügen!
  const handleConvertLeadToActiveContract = (lead: KiAuditLead) => {
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    
    // Calculate 12-month end date
    const end = new Date(today);
    end.setFullYear(end.getFullYear() + 1);
    const endDateStr = end.toISOString().split('T')[0];

    // Generate Invoice ID
    const invoiceNum = `RE-2026-${String(contracts.length + 80).padStart(3, '0')}`;

    const newContract: ContractRecord = {
      id: `ct-${Date.now()}`,
      clientName: lead.clientName,
      clientPhone: lead.clientPhone,
      clientEmail: lead.clientEmail,
      service: lead.service,
      provider: lead.bestOfferProvider,
      tariffName: lead.bestOfferName,
      meterNumber: lead.meterNumber || 'MTR-' + Math.floor(10000 + Math.random() * 90000),
      annualKwh: lead.annualKwh,
      currentMonthlyInstallment: lead.bestOfferMonthly,
      startDate: startDateStr,
      durationMonths: 12,
      noticePeriodDays: 30,
      endDate: endDateStr,
      status: 'active',
      provision: lead.provisionExpected,
      accountingInvoiceId: invoiceNum,
      accountingStatus: 'gebucht',
      safeInstallmentRecommended: lead.bestOfferMonthly,
      backpaymentRisk: 0,
      nextBestOffer: {
        provider: 'E.ON Energie',
        tariff: 'Anschlussgarant 2027',
        newMonthly: lead.bestOfferMonthly - 4,
        newAnnual: (lead.bestOfferMonthly - 4) * 12,
        savingsPerYear: 48,
      },
    };

    // Add to contracts
    setContracts((prev) => [newContract, ...prev]);

    // Update lead status
    setKiLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: 'abgeschlossen' } : l))
    );

    // Sync into CRM Contacts
    setCrmContacts((prev) => {
      const existing = prev.find(
        (c) => c.fullName.toLowerCase() === lead.clientName.toLowerCase() || c.email === lead.clientEmail
      );
      if (existing) {
        return prev.map((c) => {
          if (c.id === existing.id) {
            return {
              ...c,
              contracts: [newContract, ...c.contracts],
              optimizationProcesses: c.optimizationProcesses.map((p) =>
                p.service === lead.service
                  ? {
                      ...p,
                      stage: 'erfolgreich_aktiv' as const,
                      lastUpdatedDate: new Date().toLocaleDateString('de-DE'),
                      notes: `${p.notes} · Vertrag erfolgreich abgeschlossen (${invoiceNum})`,
                    }
                  : p
              ),
              status: 'aktiv' as const,
            };
          }
          return c;
        });
      } else {
        const newCrmContact: CustomerContact = {
          id: `kd-${Date.now()}`,
          customerNumber: `KD-2026-${String(prev.length + 1).padStart(3, '0')}`,
          fullName: lead.clientName,
          phone: lead.clientPhone,
          email: lead.clientEmail,
          address: 'Leipzig',
          city: 'Leipzig',
          postalCode: '04329',
          preferredContact: 'whatsapp',
          customerSince: new Date().toLocaleDateString('de-DE'),
          tags: ['Neukunde', lead.service.toUpperCase()],
          contracts: [newContract],
          optimizationProcesses: [
            {
              id: `proc-${Date.now()}`,
              service: lead.service,
              stage: 'erfolgreich_aktiv',
              currentProvider: lead.currentProvider,
              targetProvider: lead.bestOfferProvider,
              targetTariff: lead.bestOfferName,
              potentialAnnualSavings: lead.calculatedSavings,
              currentMonthlyInstallment: lead.bestOfferMonthly,
              startedDate: new Date().toLocaleDateString('de-DE'),
              lastUpdatedDate: new Date().toLocaleDateString('de-DE'),
              notes: `Vertrag erfolgreich umgestellt. Beleg ${invoiceNum}`,
            },
          ],
          notes: lead.notes,
          totalAnnualSavingsCalculated: lead.calculatedSavings,
          status: 'aktiv',
        };
        return [newCrmContact, ...prev];
      }
    });

    showNotification(
      `Vertrag für ${lead.clientName} erfolgreich abgeschlossen! In Kundenbestand gelistet & ${lead.provisionExpected} € Provision gebucht (${invoiceNum})`
    );
  };

  // 1-Klick: Neue Kundenrechnung durch KI analysieren & simulieren
  const handleSimulateNewKiScan = () => {
    setIsProcessingAi(true);
    setTimeout(() => {
      const mockLead: KiAuditLead = {
        id: `lead-${Date.now()}`,
        date: new Date().toLocaleDateString('de-DE'),
        clientName: 'Familie Schütze',
        clientEmail: 'schuetze.leipzig@gmx.de',
        clientPhone: '+49 173 5511223',
        service: 'gas',
        currentProvider: 'Mitgas Grundversorgung',
        annualKwh: 22000,
        currentMonthly: 195,
        currentAnnual: 2340,
        meterNumber: 'GAS-04317-' + Math.floor(1000 + Math.random() * 9000),
        bestOfferName: 'Daryos Gas-Safe 12M',
        bestOfferProvider: 'Vattenfall Europe Gas',
        bestOfferAnnual: 1720,
        bestOfferMonthly: 143,
        calculatedSavings: 620,
        provisionExpected: 80,
        aiConfidence: 99,
        status: 'neu',
        notes: 'KI-OCR: Hoher Alt-Arbeitspreis (12.4 ct/kWh) erkannt. Dringender Wechsel angeraten!',
      };
      setKiLeads((prev) => [mockLead, ...prev]);
      setIsProcessingAi(false);
      showNotification('KI-Analyse abgeschlossen: Gas-Rechnung 22.000 kWh erkannt · 620 € Ersparnis berechnet!');
    }, 1200);
  };

  // 1-Klick: Folge-Angebot vor Kündigungsfrist an Kunden senden
  const handleSendRenewalReminder = (ct: ContractRecord) => {
    if (!ct.nextBestOffer) return;
    const subject = encodeURIComponent(`Wichtig: Kündigungsfrist & automatischer Folgetarif für ${ct.clientName}`);
    const body = encodeURIComponent(
      `Hallo Herr/Frau ${ct.clientName},\n\n` +
      `Ihr aktueller Vertrag (${ct.tariffName} bei ${ct.provider}) läuft am ${ct.endDate} aus.\n` +
      `Damit Sie nicht automatisch in einen teuren Verlängerungstarif rutschen, hat unser System bereits den perfekten Anschlussvertrag gesucht:\n\n` +
      `• Neuer Folgetarif: ${ct.nextBestOffer.tariff} (${ct.nextBestOffer.provider})\n` +
      `• Neuer monatlicher Abschlag: nur ${ct.nextBestOffer.newMonthly} € / Monat\n` +
      `• Zusätzliche Ersparnis: ${ct.nextBestOffer.savingsPerYear} € pro Jahr!\n` +
      `• Inklusive Nachzahlungs-Schutz\n\n` +
      `Sollen wir den nahtlosen Wechsel für Sie aktivieren?\n\n` +
      `Viele Grüße\nDaryos Kreis · Leipzig`
    );
    window.location.href = `mailto:${ct.clientEmail}?subject=${subject}&body=${body}`;
    showNotification(`Verlängerungs-Angebot an ${ct.clientName} per E-Mail generiert!`);
  };

  // Nachzahlungs-Schutz: Empfehlung an Kunden senden
  const handleSendNachzahlungWarning = () => {
    if (!nzResult) return;
    const isDanger = nzResult.riskStatus === 'danger';
    const subject = encodeURIComponent(
      isDanger
        ? `Wichtige Warnung vor Nachzahlung: Abschlags-Optimierung von Daryos®`
        : `Daryos® Nachzahlungs-Schutz: Ihr Abschlags-Check`
    );

    const body = encodeURIComponent(
      `Hallo ${nzClientName},\n\n` +
      `wir haben Ihren aktuellen Energie-Abschlag für ${nzResult.service.toUpperCase()} geprüft:\n\n` +
      `• Jahresverbrauch: ${nzResult.annualKwh.toLocaleString('de-DE')} kWh\n` +
      `• Aktueller monatlicher Abschlag: ${nzResult.currentMonthlyPaid} € / Monat (${nzResult.paidAnnualTotal} € im Jahr)\n` +
      `• Tatsächlich erwartete Jahreskosten: ${nzResult.expectedAnnualCost} € / Jahr\n\n` +
      (isDanger
        ? `⚠️ ACHTUNG: Ihr aktueller Abschlag ist zu niedrig! Bei unverändertem Abschlag droht eine NACHZAHLUNG von ca. +${nzResult.difference} € bei der Jahresabrechnung!\n\n` +
          `🛡️ UNSERE EMPFEHLUNG:\nErhöhen Sie Ihren monatlichen Abschlag auf ${nzResult.recommendedSafeMonthly} € / Monat. Damit sind Sie garantiert abgesichert und haben 0 € Nachzahlung!\n\n`
        : `✓ ALLES IM GRÜNEN BEREICH:\nIhr monatlicher Abschlag ist sicher kalkuliert. Es ist keine böse Nachzahlung zu erwarten.\n\n`) +
      `Bei Fragen unterstützen wir Sie jederzeit gerne persönlich.\n\n` +
      `Mit freundlichen Grüßen\n` +
      `Daryos Kreis · Ihr Energieberater in Leipzig`
    );

    window.location.href = `mailto:${nzClientEmail}?subject=${subject}&body=${body}`;
    showNotification(`Nachzahlungs-Schutz-Empfehlung an ${nzClientName} versendet!`);
  };

  // CSV Export for Buchhaltung
  const exportAccountingCSV = () => {
    const headers = ['Beleg-Nr', 'Datum', 'Kunde', 'Telefon', 'Sparte', 'Anbieter / Details', 'Status', 'Provision (€)'];
    const rows = contracts.map((c) => [
      c.accountingInvoiceId,
      c.startDate,
      `"${c.clientName}"`,
      c.clientPhone,
      c.service.toUpperCase(),
      `"${c.provider} - ${c.tariffName}"`,
      c.accountingStatus,
      c.provision,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daryos_Buchhaltung_Provisionen_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Report Export for Buchhaltung & Steuerberater
  const exportAccountingPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 16;

    // Header Top Accent Banner
    doc.setFillColor(11, 12, 16);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 27, pageWidth, 1.2, 'F');

    // Brand Wordmark
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('Daryos', margin, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('(R)', margin + 27, 9.5);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(165, 180, 252);
    doc.text('Strom, Gas, Internet und Autoversicherung', margin, 20);

    // Document Meta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('BUCHHALTUNGS- & VERTRAGS-STATUSBERICHT', pageWidth - margin, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const todayStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(`Stichtag: ${todayStr} · Daryos Kreis · Leipzig`, pageWidth - margin, 17, { align: 'right' });
    doc.text('Rotfuchsstraße 1, 04329 Leipzig · Tel: +49 176 43416174', pageWidth - margin, 21.5, { align: 'right' });

    y = 36;

    // Section 1: KPI Summary Boxes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. VERGLEICHSKENNZAHLEN & BUCHHALTUNGSSTATUS', margin, y);
    y += 5;

    const totalProvision = contracts.reduce((sum, c) => sum + (c.provision || 0), 0);
    const paidProvision = contracts.filter((c) => c.accountingStatus === 'ausgezahlt').reduce((sum, c) => sum + (c.provision || 0), 0);
    const bookedProvision = contracts.filter((c) => c.accountingStatus === 'gebucht').reduce((sum, c) => sum + (c.provision || 0), 0);

    const boxWidth = (pageWidth - margin * 2 - 9) / 4;
    const boxHeight = 17;
    const kpiData = [
      { label: 'Aktive Kundenverträge', val: `${contracts.length} Verträge`, color: [15, 23, 42] },
      { label: 'Gesamt-Provisionen', val: `${totalProvision.toLocaleString('de-DE')} EUR`, color: [37, 99, 235] },
      { label: 'Bereits ausgezahlt', val: `${paidProvision.toLocaleString('de-DE')} EUR`, color: [16, 185, 129] },
      { label: 'Forderung gebucht', val: `${bookedProvision.toLocaleString('de-DE')} EUR`, color: [245, 158, 11] },
    ];

    kpiData.forEach((kpi, idx) => {
      const bx = margin + idx * (boxWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bx, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, bx + 3, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.val, bx + 3, y + 12.5);
    });

    y += boxHeight + 8;

    // Section 2: Active Contracts & Accounting List
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. AKTUELLE KUNDENVERTRÄGE & PROVISIONS-EINZELNACHWEISE', margin, y);
    y += 5;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Beleg-Nr.', margin + 3, y + 4.5);
    doc.text('Kunde / Kontakt', margin + 25, y + 4.5);
    doc.text('Sparte', margin + 65, y + 4.5);
    doc.text('Versorger / Tarif', margin + 85, y + 4.5);
    doc.text('Laufzeit bis', margin + 130, y + 4.5);
    doc.text('Status', margin + 155, y + 4.5);
    doc.text('Provision', pageWidth - margin - 2, y + 4.5, { align: 'right' });

    y += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    contracts.forEach((ct, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      }
      doc.setTextColor(71, 85, 105);
      doc.text(ct.accountingInvoiceId, margin + 3, y + 4.2);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(ct.clientName, margin + 25, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(ct.service.toUpperCase(), margin + 65, y + 4.2);
      doc.text(`${ct.provider}`, margin + 85, y + 4.2);
      doc.text(ct.endDate, margin + 130, y + 4.2);

      doc.setTextColor(ct.accountingStatus === 'ausgezahlt' ? 16 : 37, ct.accountingStatus === 'ausgezahlt' ? 185 : 99, ct.accountingStatus === 'ausgezahlt' ? 129 : 235);
      doc.text(ct.accountingStatus.toUpperCase(), margin + 155, y + 4.2);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${ct.provision} EUR`, pageWidth - margin - 2, y + 4.2, { align: 'right' });

      y += 6;
    });

    // Subtotal Row
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 1.5;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('SUMME VERMITTLUNGSPROVISIONEN:', margin + 3, y + 4.8);
    doc.setTextColor(37, 99, 235);
    doc.text(`${totalProvision.toLocaleString('de-DE')} EUR`, pageWidth - margin - 2, y + 4.8, { align: 'right' });

    y += 14;

    // Section 3: Notes
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('BUCHHALTUNGS- & FRISTEN-HINWEISE:', margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Dieser Bericht dokumentiert vermittelte Verträge, Fälligkeiten und Rechnungs-Belegnummern für Lexoffice/DATEV.', margin + 3, y + 9.5);
    doc.text('2. Der automatisierte Fristen-Wächter warnt 60 bis 90 Tage vor Vertragsende, um rechtzeitig den Folge-Vergleich durchzuführen.', margin + 3, y + 13.5);
    doc.text('3. Der integrierte Nachzahlungs-Schutz prüft Abschlagszahlungen zur Vermeidung von Rückständen gemäß EnWG.', margin + 3, y + 17);

    // Footer
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Daryos(R) Tarifoptimierung & Wechselservice · Rotfuchsstraße 1, 04329 Leipzig · daryos.kreis@gmail.com', margin, footerY + 2);
    doc.text('Seite 1 von 1 · Buchhaltungsdokument', pageWidth - margin, footerY + 2, { align: 'right' });

    const filenameDate = new Date().toISOString().split('T')[0];
    doc.save(`Daryos_Buchhaltung_Kundenvertraege_${filenameDate}.pdf`);
  };

  // Warning count for expiring contracts
  const expiringContractsCount = contracts.filter(
    (c) => c.status === 'critical_cancellation' || c.status === 'warning_renewal'
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Toast Action Notice */}
        {actionNotice && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 font-semibold text-center flex items-center justify-center gap-2 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 shadow-2xs">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-logo italic text-lg font-bold text-blue-600 tracking-wide">
                  Daryos<sup className="text-[10px] ml-0.5 font-sans font-bold">®</sup>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  KI-Cockpit & Automatisierung
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Zentrale Steuerung: Kunden-Meldungen, Projekte, Angebote, Rechnungen, Verträge & Fristen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <>
                <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  authUser.role === 'eigentuemer'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}>
                  {authUser.role === 'eigentuemer' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>
                    {authUser.role === 'eigentuemer'
                      ? `Eigentümer: ${ownerEmail}`
                      : `Admin: ${authUser.name}`}
                  </span>
                </div>


                <button
                  onClick={exportAccountingPDF}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  title="PDF-Bericht für Buchhaltung & Steuerberater"
                >
                  <FileDown className="w-4 h-4 text-blue-600" />
                  <span>PDF-Bericht</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Sitzung beenden, Cockpit sperren und vor Besuchern verbergen"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abmelden & Sperren</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 border border-slate-300 text-xs font-bold cursor-pointer transition-colors"
              title="Zur Kunden-Website zurückkehren"
            >
              <span>🌐 Kunden-Website</span>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Lock Screen if not authenticated - Streng geschützt: Nur für Eigentümer & Admins */}
        {!authUser ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 max-w-md w-full space-y-5 shadow-xl">
              
              {/* Header Badge */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-blue-50 border border-slate-200 shadow-2xs mx-auto">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-500" />
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Geschützter interner Bereich</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Eigentümer- & Administrator-Zugang
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dieses Cockpit und alle Automatisierungs-Module sind <strong>ausschließlich für den Eigentümer (Daryos® · Emmoke@outlook.de) und autorisierte Administratoren</strong> bestimmt.
                </p>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setLoginRole('eigentuemer'); setPinError(''); }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    loginRole === 'eigentuemer'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Crown className={`w-3.5 h-3.5 ${loginRole === 'eigentuemer' ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>1. Eigentümer (Inhaber)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginRole('admin'); setPinError(''); }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    loginRole === 'admin'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${loginRole === 'admin' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>2. Administrator</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handlePinSubmit} className="space-y-4">
                {loginRole === 'eigentuemer' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Eigentümer-Konto
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950 font-medium">
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold">Emmoke@outlook.de (Inhaber Daryos®)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Inhaber-Passwort oder PIN
                      </label>
                      <input
                        type="password"
                        autoFocus
                        placeholder="Passwort"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full text-center tracking-widest text-base font-mono py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Administrator-Rolle
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-950 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Technischer Administrator (admin@daryos.de)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Admin-PIN eingeben
                      </label>
                      <input
                        type="password"
                        autoFocus
                        placeholder="Passwort"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
                      />
                    </div>
                  </div>
                )}

                {pinError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-center leading-snug">
                    {pinError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                    loginRole === 'eigentuemer'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {loginRole === 'eigentuemer'
                      ? 'Als Eigentümer entsperren (Vollzugriff)'
                      : 'Als Administrator freischalten'}
                  </span>
                </button>
              </form>

            </div>
          </div>
        ) : (
          /* Main Cockpit Body */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Tablet Navigation Tabs - Klar strukturiert, hell & einheitlich */}
            <div className="bg-white px-4 sm:px-6 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-2xs">
              
              {/* Tab 1: Kunden-Meldungen */}
              <button
                onClick={() => setActiveTab('meldungen')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'meldungen'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>1. Kunden-Meldungen</span>
                {customerMessages.filter((m) => m.status === 'neu').length > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === 'meldungen' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {customerMessages.filter((m) => m.status === 'neu').length}
                  </span>
                )}
              </button>

              {/* Tab 2: Projekte */}
              <button
                onClick={() => setActiveTab('projekte')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'projekte'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>2. Projekte</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  activeTab === 'projekte' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {optimizationProjects.length}
                </span>
              </button>

              {/* Tab 3: Angebote */}
              <button
                onClick={() => setActiveTab('angebote')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'angebote'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Angebote</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  activeTab === 'angebote' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {customerOffers.length}
                </span>
              </button>

              {/* Tab 4: Vertragsliste & Fristen */}
              <button
                onClick={() => setActiveTab('vertraege')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'vertraege'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>4. Vertragsliste</span>
                {expiringContractsCount > 0 ? (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold animate-pulse ${
                    activeTab === 'vertraege' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}>
                    {expiringContractsCount}
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === 'vertraege' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {contracts.length}
                  </span>
                )}
              </button>

              {/* Tab 5: Rechnungen */}
              <button
                onClick={() => setActiveTab('rechnungen')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'rechnungen'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>5. Rechnungen</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  activeTab === 'rechnungen' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {invoices.length}
                </span>
              </button>

              {/* Tab 6: Rechnung erstellen (Vollfunktion) */}
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setActiveTab('rechnung_erstellen');
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'rechnung_erstellen'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Rechnung erstellen</span>
              </button>

              {/* Tab 7: Kunden-CRM */}
              <button
                onClick={() => setActiveTab('crm')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'crm'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>6. Kunden-CRM</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  activeTab === 'crm' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {crmContacts.length}
                </span>
              </button>

              {/* Tab 8: Nachzahlungs-Schutz */}
              <button
                onClick={() => setActiveTab('nachzahlung')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'nachzahlung'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>7. Nachzahlungs-Schutz</span>
              </button>

              {/* Tab 9: Marktpreise & Tarife */}
              <button
                onClick={() => setActiveTab('tarife')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'tarife'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>8. Marktpreise & Margen</span>
              </button>

              {/* Tab 10: KI-Rechnungs-Scan */}
              <button
                onClick={() => setActiveTab('ki_inbox')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === 'ki_inbox'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>9. KI-Scan & OCR</span>
              </button>
            </div>

            {/* TAB: KUNDEN-MELDUNGEN */}
            {activeTab === 'meldungen' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <CustomerMessagesTab
                  messages={customerMessages}
                  onUpdateStatus={handleUpdateMessageStatus}
                  onDeleteMessage={handleDeleteMessage}
                  onCreateOfferForCustomer={(msg) => {
                    handleOpenInvoiceCreator(msg.customerName, msg.service === 'allgemein' ? undefined : msg.service);
                  }}
                />
              </div>
            )}

            {/* TAB: PROJEKTE & WECHSELAUFTRÄGE */}
            {activeTab === 'projekte' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <ProjectsTab
                  projects={optimizationProjects}
                  onUpdateStage={handleUpdateProjectStage}
                  onOpenInvoiceCreator={(customerName, service) => {
                    handleOpenInvoiceCreator(customerName, service);
                  }}
                />
              </div>
            )}

            {/* TAB: ANGEBOTE & TARIFVERGLEICHE */}
            {activeTab === 'angebote' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <OffersTab
                  offers={customerOffers}
                  onUpdateStatus={handleUpdateOfferStatus}
                  onSendOfferWhatsApp={handleSendOfferWhatsApp}
                  onSendOfferEmail={handleSendOfferEmail}
                  onOpenInvoiceCreator={(customerName, service) => {
                    handleOpenInvoiceCreator(customerName, service);
                  }}
                />
              </div>
            )}

            {/* TAB: RECHNUNGEN & BUCHHALTUNG */}
            {activeTab === 'rechnungen' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <InvoicesTab
                  invoices={invoices}
                  onOpenCreateNew={() => handleOpenInvoiceCreator()}
                  onUpdateStatus={handleUpdateInvoiceStatus}
                  onDeleteInvoice={handleDeleteInvoice}
                  onDownloadInvoicePDF={handleDownloadInvoicePDF}
                />
              </div>
            )}

            {/* TAB: RECHNUNG ERSTELLEN (VOLLFUNKTION) */}
            {activeTab === 'rechnung_erstellen' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <InvoiceBuilder
                  crmContacts={crmContacts}
                  initialInvoice={editingInvoice}
                  onSaveInvoice={handleSaveInvoice}
                  onCancel={() => {
                    setEditingInvoice(null);
                    setActiveTab('rechnungen');
                  }}
                />
              </div>
            )}

            {/* TAB: KI-RECHNUNGS-SCAN & OCR */}
            {activeTab === 'ki_inbox' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span>KI-Rechnungs-Eingang & Tarif-Entscheidung</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-bold">
                        KI OCR Scanner
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Eingehende Rechnungen & Verbrauchsdaten werden automatisiert analysiert, verglichen und sortiert. Sie entscheiden mit 1 Klick!
                    </p>
                  </div>

                  <button
                    onClick={handleSimulateNewKiScan}
                    disabled={isProcessingAi}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className={`w-4 h-4 text-amber-300 ${isProcessingAi ? 'animate-spin' : ''}`} />
                    <span>{isProcessingAi ? 'KI analysiert Rechnung...' : 'Neue Rechnung per KI scannen'}</span>
                  </button>
                </div>

                {/* Grid of Incoming Leads */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {kiLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        lead.status === 'neu'
                          ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-100'
                          : lead.status === 'abgeschlossen'
                          ? 'bg-white border-emerald-200 shadow-2xs'
                          : 'bg-white border-slate-200 shadow-2xs'
                      } space-y-4 text-slate-800`}
                    >
                      {/* Lead Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{lead.clientName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                              {lead.date}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{lead.clientPhone}</span>
                            <span>•</span>
                            <span>{lead.clientEmail}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                            lead.status === 'neu'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : lead.status === 'angebot_gesendet'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {lead.status === 'neu'
                            ? '⚡ Neu zur Entscheidung'
                            : lead.status === 'angebot_gesendet'
                            ? '✉️ Angebot versendet'
                            : '✓ Vertrag im Bestand'}
                        </span>
                      </div>

                      {/* AI Extraction Data Box */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Sparte & Zähler</span>
                          <span className="font-bold text-slate-800 uppercase">{lead.service}</span>
                          {lead.meterNumber && (
                            <span className="block font-mono text-[9px] text-slate-500">{lead.meterNumber}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Bisheriger Versorger</span>
                          <span className="text-slate-700 truncate block font-medium">{lead.currentProvider}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Bisherige Kosten</span>
                          <span className="font-mono text-slate-800 font-semibold">
                            {lead.currentAnnual} €/J. ({lead.currentMonthly} €/M.)
                          </span>
                        </div>
                      </div>

                      {/* Best Offer Calculated by AI */}
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Beste KI-Tarif-Empfehlung:</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                            +{lead.calculatedSavings} € Ersparnis / Jahr
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="text-xs text-slate-900 font-bold">
                            {lead.bestOfferName} <span className="text-slate-500 font-normal">({lead.bestOfferProvider})</span>
                          </div>
                          <div className="scale-75 origin-right">
                            <ProviderLogo id={lead.bestOfferProvider} size="sm" variant="light" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-blue-200/60">
                          <span>Neuer monatlicher Abschlag:</span>
                          <span className="font-mono font-bold text-blue-700">{lead.bestOfferMonthly} € / Monat</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between">
                          <span>Daryos Vermittlungsprovision:</span>
                          <span className="font-mono text-emerald-700 font-bold">{lead.provisionExpected} €</span>
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="pt-1 flex flex-wrap gap-2 text-xs">
                        {/* Send Offer Email */}
                        <button
                          onClick={() => handleSendLeadEmail(lead)}
                          className="flex-1 min-w-[130px] py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Angebot per E-Mail</span>
                        </button>

                        {/* Send Offer WhatsApp */}
                        <button
                          onClick={() => handleSendLeadWhatsApp(lead)}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Convert to Active Contract and Buchhaltung */}
                        {lead.status !== 'abgeschlossen' && (
                          <button
                            onClick={() => handleConvertLeadToActiveContract(lead)}
                            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Vertrag abschließen & in Buchhaltung buchen (+{lead.provisionExpected} €)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: KUNDEN-CRM & OPTIMIERUNGSPROZESSE */}
            {activeTab === 'crm' && (
              <CrmModule
                contacts={crmContacts}
                onUpdateContact={handleUpdateCrmContact}
                onAddContact={handleAddCrmContact}
                onDeleteContact={handleDeleteCrmContact}
                onOpenNachzahlungCheck={handleOpenNachzahlungFromCrm}
                onSendNotification={showNotification}
              />
            )}

            {/* TAB: VERTRAGSLISTE & FRISTEN-WÄCHTER */}
            {activeTab === 'vertraege' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <span>Aktiver Kundenbestand & Fristen-Wächter</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-bold">
                        {contracts.length} Verträge betreut
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automatische Fristen-Erinnerung vor Kündigungsstichtag mit sofortiger Suche nach neuem Folge-Tarif!
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportAccountingPDF}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Bestands-PDF</span>
                    </button>
                  </div>
                </div>

                {/* Alarm Banner if contracts are expiring */}
                {expiringContractsCount > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900 shadow-2xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-rose-800 text-sm">
                        Achtung: {expiringContractsCount} Kundenvertrag/Verträge nähern sich der Kündigungsfrist!
                      </div>
                      <p className="text-rose-700 leading-relaxed">
                        Das System hat für jeden dieser Verträge bereits einen neuen Vergleichstarif vorbereitet. Senden Sie mit 1 Klick das Folge-Angebot, damit die Kunden nicht in teure Verlängerungen geraten.
                      </p>
                    </div>
                  </div>
                )}

                {/* Contracts List Table */}
                <div className="space-y-3">
                  {contracts.map((ct) => (
                    <div
                      key={ct.id}
                      className={`p-4 rounded-xl border transition-all ${
                        ct.status === 'critical_cancellation'
                          ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                          : ct.status === 'warning_renewal'
                          ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                      } space-y-3`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{ct.clientName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-bold">
                              {ct.service}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              Beleg: {ct.accountingInvoiceId}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="inline-flex items-center gap-1.5">
                              <span>Versorger:</span>
                              <div className="scale-75 origin-left inline-block">
                                <ProviderLogo id={ct.provider} size="sm" variant="light" />
                              </div>
                              <span className="text-slate-800 font-medium">({ct.tariffName})</span>
                            </div>
                            <span>•</span>
                            <span>Zähler: <strong className="text-slate-800 font-mono">{ct.meterNumber}</strong></span>
                            <span>•</span>
                            <span>Abschlag: <strong className="text-blue-700 font-mono">{ct.currentMonthlyInstallment} € / Monat</strong></span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Laufzeit-Ende:</span>
                            <span className="font-mono text-xs font-bold text-slate-900">{ct.endDate}</span>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                              ct.status === 'critical_cancellation'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : ct.status === 'warning_renewal'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {ct.status === 'critical_cancellation' && <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />}
                            {ct.status === 'warning_renewal' && <BellRing className="w-3.5 h-3.5 text-amber-600" />}
                            {ct.status === 'active' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>
                              {ct.status === 'critical_cancellation'
                                ? 'Kündigungsfrist beachten!'
                                : ct.status === 'warning_renewal'
                                ? 'Erinnerung fällig'
                                : 'Laufzeit aktiv'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Auto-Next Best Offer Box */}
                      {ct.nextBestOffer && (
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Automatischer Folge-Vergleich für Verlängerung:</span>
                            </div>
                            <div className="text-slate-700">
                              Empfehlung: <strong>{ct.nextBestOffer.tariff}</strong> ({ct.nextBestOffer.provider}) · Spart weitere{' '}
                              <strong className="text-emerald-700">+{ct.nextBestOffer.savingsPerYear} € / Jahr</strong> (nur {ct.nextBestOffer.newMonthly} € / Monat)
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendRenewalReminder(ct)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Folge-Angebot senden</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: NACHZAHLUNGS-SCHUTZ & ABSCHLAGS-OPTIMIERER */}
            {activeTab === 'nachzahlung' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>Daryos® Nachzahlungs-Schutz & Abschlags-Optimierer</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schützt Ihre Kunden vor bösen Überraschungen bei der Jahresabrechnung. Automatische Analyse von Abschlag vs. Verbrauch.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Inputs */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                    <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                      Kundendaten & Verbrauchs-Parameter
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Name des Kunden</label>
                        <input
                          type="text"
                          value={nzClientName}
                          onChange={(e) => setNzClientName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">E-Mail für Bescheid</label>
                        <input
                          type="email"
                          value={nzClientEmail}
                          onChange={(e) => setNzClientEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Sparte</label>
                        <select
                          value={nzService}
                          onChange={(e) => setNzService(e.target.value as ServiceType)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="gas">🔥 Erdgas</option>
                          <option value="strom">⚡ Strom</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 mb-1 font-medium">Jahresverbrauch (kWh)</label>
                        <input
                          type="number"
                          step="500"
                          value={nzKwh}
                          onChange={(e) => setNzKwh(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">
                        Aktueller monatlicher Abschlag des Kunden (€/Monat)
                      </label>
                      <input
                        type="number"
                        step="5"
                        value={nzCurrentInstallment}
                        onChange={(e) => setNzCurrentInstallment(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Entspricht {nzCurrentInstallment * 12} € geleisteten Vorauszahlungen pro Jahr.
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Hinterlegter Arbeitspreis:</span>
                        <span className="font-mono text-slate-900 font-semibold">
                          {nzService === 'gas' ? config.gasArbeitspreis : config.stromArbeitspreis} ct/kWh
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hinterlegter Grundpreis:</span>
                        <span className="font-mono text-slate-900 font-semibold">
                          {nzService === 'gas' ? config.gasGrundpreis : config.stromGrundpreis} €/Monat
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis & Recommendations */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3">
                        Diagnose & Nachzahlungs-Prüfung
                      </div>

                      {nzResult && (
                        <div className="space-y-4 text-xs">
                          {/* Alert Banner */}
                          {nzResult.riskStatus === 'danger' ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
                              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                <span>Achtung: Hohe Nachzahlungsgefahr!</span>
                              </div>
                              <p className="leading-relaxed">
                                Der Kunde zahlt monatlich <strong>{nzResult.currentMonthlyPaid} €</strong>, verbraucht aber rechnerisch{' '}
                                <strong>{nzResult.expectedAnnualCost} €</strong> im Jahr. Bei der nächsten Jahresabrechnung droht eine Nachzahlung von ca.{' '}
                                <strong className="text-rose-900 text-sm font-mono underline decoration-rose-500">
                                  +{nzResult.difference} €
                                </strong>!
                              </p>
                            </div>
                          ) : nzResult.riskStatus === 'overpay' ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-blue-800">
                              <div className="flex items-center gap-2 font-bold text-sm text-blue-700">
                                <DollarSign className="w-5 h-5 text-blue-600 shrink-0" />
                                <span>Guthaben erwartet (Abschlag zu hoch)</span>
                              </div>
                              <p className="leading-relaxed">
                                Der Kunde zahlt monatlich mehr als erforderlich ein. Es wird ein Guthaben von ca.{' '}
                                <strong>{Math.abs(nzResult.difference)} €</strong> erwartet.
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-800">
                              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Optimaler Bereich: 0 € Nachzahlung</span>
                              </div>
                              <p className="leading-relaxed">
                                Der Abschlag deckt den Verbrauch perfekt ab. Der Kunde ist geschützt und muss keine Nachzahlung befürchten.
                              </p>
                            </div>
                          )}

                          {/* Safe Installment Recommendation Box */}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                              Empfohlener Daryos-Sicherheitsabschlag:
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-black font-mono text-emerald-700">
                                {nzResult.recommendedSafeMonthly} €
                              </span>
                              <span className="text-xs text-slate-500">pro Monat (inkl. Puffer)</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Damit ist der Kunde vor Energiepreisschwankungen und unberechtigten Nachzahlungsforderungen abgesichert.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendNachzahlungWarning}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Nachzahlungs-Schutz-Bescheid an {nzClientName} senden</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LIVE-TARIFE & MARKTPREISE STEUERN */}
            {activeTab === 'tarife' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Aktuelle Marktpreise & Provisionen steuern
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Änderungen wirken sich direkt live auf den Spar-Rechner der Website und den KI-Vergleicher aus.
                    </p>
                  </div>
                  {savedSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Preise erfolgreich gespeichert & live aktiv!</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strom */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                        <Zap className="w-4 h-4" />
                        <span>Strom Besttarif-Parameter</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Arbeitspreis (ct/kWh)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={config.stromArbeitspreis}
                            onChange={(e) => setConfig({ ...config, stromArbeitspreis: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Grundpreis (€/Monat)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={config.stromGrundpreis}
                            onChange={(e) => setConfig({ ...config, stromGrundpreis: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="text-xs">
                        <label className="block text-slate-600 mb-1 font-medium">Provision Strom (€/Wechsel)</label>
                        <input
                          type="number"
                          value={config.provisionStrom}
                          onChange={(e) => setConfig({ ...config, provisionStrom: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Gas */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                        <Flame className="w-4 h-4" />
                        <span>Gas Besttarif-Parameter</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Arbeitspreis (ct/kWh)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={config.gasArbeitspreis}
                            onChange={(e) => setConfig({ ...config, gasArbeitspreis: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Grundpreis (€/Monat)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={config.gasGrundpreis}
                            onChange={(e) => setConfig({ ...config, gasGrundpreis: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="text-xs">
                        <label className="block text-slate-600 mb-1 font-medium">Provision Gas (€/Wechsel)</label>
                        <input
                          type="number"
                          value={config.provisionGas}
                          onChange={(e) => setConfig({ ...config, provisionGas: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Internet & KFZ */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        <Wifi className="w-4 h-4" />
                        <span>Internet / Glasfaser</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Monatspreis Promo (€)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={config.internetPromoPrice}
                            onChange={(e) => setConfig({ ...config, internetPromoPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Provision Internet (€)</label>
                          <input
                            type="number"
                            value={config.provisionInternet}
                            onChange={(e) => setConfig({ ...config, provisionInternet: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        <Car className="w-4 h-4" />
                        <span>KFZ-Ersparnis-Quote & Provision</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Durchschnitts-Ersparnis (%)</label>
                          <input
                            type="number"
                            value={config.kfzAvgSavingsPercent}
                            onChange={(e) => setConfig({ ...config, kfzAvgSavingsPercent: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-medium">Provision KFZ (€)</label>
                          <input
                            type="number"
                            value={config.provisionKfz}
                            onChange={(e) => setConfig({ ...config, provisionKfz: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>Preise speichern & live anwenden</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 6: Automatisierungs-Blueprint & Tablet-Schnittstellen */}
            {activeTab === 'automatisierung' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <div>
                  <h4 className="text-base font-bold text-white">
                    Vollautomatisierungs-Architektur für Daryos®
                  </h4>
                  <p className="text-xs text-slate-400">
                    Schritt-für-Schritt-Ablauf: Eingang → KI-Scan → Vergleich → 1-Klick-Mail → Buchhaltung → Fristen-Wächter → Nachzahlungs-Schutz
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Step 1 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-400">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-xs">1</span>
                      <span>KI-Rechnungsextraktion</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Liest automatisch Zählernummer, kWh-Jahresverbrauch, Altversorger und bisherigen monatlichen Abschlag aus Fotos oder PDFs aus.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-orange-400">
                      <span className="w-6 h-6 rounded-full bg-orange-600/20 flex items-center justify-center text-xs">2</span>
                      <span>Live-Vergleich & 1-Klick-Mail</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Ermittelt den besten Spartarif und berechnet die Ersparnis. Ein Klick versendet ein rechtssicheres Kundenangebot per E-Mail & WhatsApp.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <span className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center text-xs">3</span>
                      <span>Buchhaltungs-Sync (Lexoffice/DATEV)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Bei Vertragsabschluss wird der Kunde im Bestand gelistet und die Vermittlungsprovision (z.B. 80 €) sofort mit Belegnummer verbucht.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-400">
                      <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs">4</span>
                      <span>Fristen-Wächter & Auto-Verlängerung</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Überwacht Vertragslaufzeiten (12/24 Monate). 60 Tage vor Kündigungsfrist sucht das System automatisch den neuen Folgevertrag!
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-cyan-400">
                      <span className="w-6 h-6 rounded-full bg-cyan-600/20 flex items-center justify-center text-xs">5</span>
                      <span>Daryos® Nachzahlungs-Schutz</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Rechnet Vorauszahlungen gegen den Soll-Verbrauch hoch und warnt frühzeitig, falls ein Abschlag zu niedrig ist. Garantiert 0 € Nachzahlung!
                    </p>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-[#121319] p-4 rounded-xl border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-purple-400">
                      <span className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center text-xs">6</span>
                      <span>Tablet-Ready für Beratung</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Optimiert für Tablets im Beratungsgespräch in Leipzig oder unterwegs. Schneller Zugriff per Berater-PIN (1234).
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span>
                    Buchhaltungs-Export für Ihren Steuerberater oder Buchhaltungssoftware:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={exportAccountingCSV}
                      className="px-4 py-2 bg-[#1e202a] hover:bg-[#252836] text-white font-bold rounded-lg cursor-pointer"
                    >
                      CSV herunterladen
                    </button>
                    <button
                      onClick={exportAccountingPDF}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                    >
                      PDF-Bericht erstellen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
