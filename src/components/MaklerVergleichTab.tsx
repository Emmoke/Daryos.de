import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Flame,
  Wifi,
  Car,
  TrendingDown,
  ArrowRight,
  User,
  Building2,
  RefreshCw,
  FileCheck,
  Download,
  Settings,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  Award,
  Clock,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { CustomerContact, ServiceType, ContractRecord } from '../types';
import { PLZ_REGIONS, getRegionInfoForPlz } from '../data/plzTarifData';
import { jsPDF } from 'jspdf';

export interface BrokerSettings {
  brokerName: string;
  brokerCompany: string;
  registrationNumber: string; // e.g. D-LEIP-88412-99 (§ 34d/c GewO)
  check24PartnerId: string;
  check24Connected: boolean;
  verivoxPartnerId: string;
  verivoxConnected: boolean;
  directSupplierPortalActive: boolean;
  commissionStrom: number; // in €
  commissionGas: number;   // in €
  commissionInternet: number; // in €
  commissionKfz: number;   // in €
}

export interface ProviderSearchResult {
  id: string;
  provider: string;
  tariffName: string;
  service: ServiceType;
  workPriceCt: number;       // ct/kWh or monthly fee
  basePriceMonthly: number;  // €/month
  monthlyCost: number;       // €/month
  annualCost: number;        // €/year
  estimatedAnnualSavings: number; // in €
  bonus: number;             // in €
  priceGuaranteeMonths: number;
  contractDurationMonths: number;
  greenEnergy: boolean;
  source: 'CHECK24 Profis' | 'Verivox Makler' | 'Versorger Direkt';
  score: number;             // e.g. 9.8/10
  specialFeature: string;
}

interface MaklerVergleichTabProps {
  crmContacts: CustomerContact[];
  onConnectContractToCustomer: (
    customerId: string,
    newContract: ContractRecord,
    commissionEarned: number
  ) => void;
  onRefreshData?: () => void;
}

export const MaklerVergleichTab: React.FC<MaklerVergleichTabProps> = ({
  crmContacts,
  onConnectContractToCustomer,
}) => {
  // 1. Makler-Einstellungen
  const [brokerSettings, setBrokerSettings] = useState<BrokerSettings>(() => {
    try {
      const saved = localStorage.getItem('daryos_broker_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      brokerName: 'Daryos Kreis',
      brokerCompany: 'Daryos® Tarifoptimierung & Wechselservice Leipzig',
      registrationNumber: 'D-LEIP-88412-99 (§ 34d GewO)',
      check24PartnerId: 'CK24-LE-94182',
      check24Connected: true,
      verivoxPartnerId: 'VVX-04329-M',
      verivoxConnected: true,
      directSupplierPortalActive: true,
      commissionStrom: 65,
      commissionGas: 80,
      commissionInternet: 50,
      commissionKfz: 90,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saveSettingsNotice, setSaveSettingsNotice] = useState(false);

  // 2. Kundenauswahl
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    crmContacts.length > 0 ? crmContacts[0].id : ''
  );

  // 3. Suchparameter für Tarifabfrage
  const selectedCustomer = crmContacts.find((c) => c.id === selectedCustomerId);

  const [activeService, setActiveService] = useState<ServiceType>('gas');
  const [plz, setPlz] = useState<string>(selectedCustomer?.postalCode || '04315');
  const [annualConsumption, setAnnualConsumption] = useState<number>(14500);
  const [currentProvider, setCurrentProvider] = useState<string>('E.ON Gas (Altvertrag)');
  const [currentMonthlyPaid, setCurrentMonthlyPaid] = useState<number>(110);
  const [selectedEcoOnly, setSelectedEcoOnly] = useState<boolean>(true);
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<'all' | '12' | '24'>('12');

  // 4. Suchstatus & gefundene Tarife
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>([]);
  const [connectedContractNotice, setConnectedContractNotice] = useState<{
    customerName: string;
    tariff: string;
    savings: number;
    commission: number;
  } | null>(null);

  // Synchronisiere Kundendaten bei Auswahl
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = crmContacts.find((c) => c.id === customerId);
    if (cust) {
      if (cust.postalCode) setPlz(cust.postalCode);
      // Wenn bestehende Verträge vorhanden sind, nimm den ersten
      if (cust.contracts && cust.contracts.length > 0) {
        const ct = cust.contracts[0];
        setActiveService(ct.service);
        setCurrentProvider(`${ct.provider} (${ct.tariffName})`);
        setCurrentMonthlyPaid(ct.currentMonthlyInstallment);
        if (ct.annualKwh) setAnnualConsumption(ct.annualKwh);
      }
    }
  };

  // Suche über Maklerschnittstellen simulieren
  const handlePerformBrokerSearch = () => {
    setIsSearching(true);
    setConnectedContractNotice(null);

    setTimeout(() => {
      let results: ProviderSearchResult[] = [];

      if (activeService === 'gas') {
        const currentAnnual = currentMonthlyPaid * 12;
        results = [
          {
            id: 'res-gas-1',
            provider: 'EnBW Energie',
            tariffName: 'EnBW Erdgas Natur 2026',
            service: 'gas',
            workPriceCt: 8.1,
            basePriceMonthly: 10.9,
            monthlyCost: Math.round(((annualConsumption * 0.081) + 130.8) / 12),
            annualCost: Math.round((annualConsumption * 0.081) + 130.8),
            estimatedAnnualSavings: Math.max(120, currentAnnual - Math.round((annualConsumption * 0.081) + 130.8)),
            bonus: 100,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: true,
            source: 'CHECK24 Profis',
            score: 9.8,
            specialFeature: 'TÜV-zertifiziertes Ökogas & 12M Preisgarantie',
          },
          {
            id: 'res-gas-2',
            provider: 'Vattenfall',
            tariffName: 'Vattenfall Erdgas Easy 24',
            service: 'gas',
            workPriceCt: 8.3,
            basePriceMonthly: 11.5,
            monthlyCost: Math.round(((annualConsumption * 0.083) + 138) / 12),
            annualCost: Math.round((annualConsumption * 0.083) + 138),
            estimatedAnnualSavings: Math.max(90, currentAnnual - Math.round((annualConsumption * 0.083) + 138)),
            bonus: 120,
            priceGuaranteeMonths: 24,
            contractDurationMonths: 24,
            greenEnergy: true,
            source: 'Verivox Makler',
            score: 9.6,
            specialFeature: 'Volle 24 Monate Preisgarantie gegen Preissprünge',
          },
          {
            id: 'res-gas-3',
            provider: 'Stadtwerke Leipzig',
            tariffName: 'L-Gas Komfort Öko',
            service: 'gas',
            workPriceCt: 8.6,
            basePriceMonthly: 12.0,
            monthlyCost: Math.round(((annualConsumption * 0.086) + 144) / 12),
            annualCost: Math.round((annualConsumption * 0.086) + 144),
            estimatedAnnualSavings: Math.max(70, currentAnnual - Math.round((annualConsumption * 0.086) + 144)),
            bonus: 60,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: true,
            source: 'Versorger Direkt',
            score: 9.4,
            specialFeature: 'Direkter Leipziger Regionalpartner & Kundenzentrum',
          },
          {
            id: 'res-gas-4',
            provider: 'MONTANA',
            tariffName: 'MONTANA Erdgas Direkt 12',
            service: 'gas',
            workPriceCt: 8.2,
            basePriceMonthly: 11.2,
            monthlyCost: Math.round(((annualConsumption * 0.082) + 134.4) / 12),
            annualCost: Math.round((annualConsumption * 0.082) + 134.4),
            estimatedAnnualSavings: Math.max(105, currentAnnual - Math.round((annualConsumption * 0.082) + 134.4)),
            bonus: 90,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: false,
            source: 'CHECK24 Profis',
            score: 9.2,
            specialFeature: 'Sehr günstiger Grundpreis, Familienunternehmen',
          },
        ];
      } else if (activeService === 'strom') {
        const currentAnnual = currentMonthlyPaid * 12;
        results = [
          {
            id: 'res-str-1',
            provider: 'Yello Strom',
            tariffName: 'Yello Strom Klima Fix 12',
            service: 'strom',
            workPriceCt: 26.2,
            basePriceMonthly: 10.4,
            monthlyCost: Math.round(((annualConsumption * 0.262) + 124.8) / 12),
            annualCost: Math.round((annualConsumption * 0.262) + 124.8),
            estimatedAnnualSavings: Math.max(140, currentAnnual - Math.round((annualConsumption * 0.262) + 124.8)),
            bonus: 130,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: true,
            source: 'CHECK24 Profis',
            score: 9.9,
            specialFeature: '100% Ökostrom & Sofortbonus bei Wechsel',
          },
          {
            id: 'res-str-2',
            provider: 'E.ON Energie Deutschland',
            tariffName: 'E.ON ÖkoStrom 24M Festpreis',
            service: 'strom',
            workPriceCt: 26.8,
            basePriceMonthly: 11.2,
            monthlyCost: Math.round(((annualConsumption * 0.268) + 134.4) / 12),
            annualCost: Math.round((annualConsumption * 0.268) + 134.4),
            estimatedAnnualSavings: Math.max(110, currentAnnual - Math.round((annualConsumption * 0.268) + 134.4)),
            bonus: 110,
            priceGuaranteeMonths: 24,
            contractDurationMonths: 24,
            greenEnergy: true,
            source: 'Verivox Makler',
            score: 9.7,
            specialFeature: '2 Jahre Planungssicherheit & stabiler Arbeitspreis',
          },
          {
            id: 'res-str-3',
            provider: 'Stadtwerke Leipzig',
            tariffName: 'L-Strom basis Öko Spezial',
            service: 'strom',
            workPriceCt: 27.5,
            basePriceMonthly: 11.5,
            monthlyCost: Math.round(((annualConsumption * 0.275) + 138) / 12),
            annualCost: Math.round((annualConsumption * 0.275) + 138),
            estimatedAnnualSavings: Math.max(80, currentAnnual - Math.round((annualConsumption * 0.275) + 138)),
            bonus: 75,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: true,
            source: 'Versorger Direkt',
            score: 9.5,
            specialFeature: 'Heimatversorger Leipzig mit Öko-Auszeichnung',
          },
        ];
      } else if (activeService === 'internet') {
        results = [
          {
            id: 'res-net-1',
            provider: 'Vodafone',
            tariffName: 'GigaZuhause 250 Kabel / Glasfaser',
            service: 'internet',
            workPriceCt: 29.99,
            basePriceMonthly: 0,
            monthlyCost: 33,
            annualCost: 396,
            estimatedAnnualSavings: 180,
            bonus: 150,
            priceGuaranteeMonths: 24,
            contractDurationMonths: 24,
            greenEnergy: false,
            source: 'CHECK24 Profis',
            score: 9.7,
            specialFeature: '250 Mbit/s Highspeed inklusive WLAN-Router & Startguthaben',
          },
          {
            id: 'res-net-2',
            provider: 'Telekom',
            tariffName: 'MagentaZuhause M (100 Mbit/s)',
            service: 'internet',
            workPriceCt: 34.95,
            basePriceMonthly: 0,
            monthlyCost: 38,
            annualCost: 456,
            estimatedAnnualSavings: 120,
            bonus: 100,
            priceGuaranteeMonths: 24,
            contractDurationMonths: 24,
            greenEnergy: false,
            source: 'Verivox Makler',
            score: 9.6,
            specialFeature: 'Höchste Netzstabilität im Leipziger Netz',
          },
          {
            id: 'res-net-3',
            provider: 'PŸUR (Tele Columbus)',
            tariffName: 'Pure Speed 200 Leipzig City',
            service: 'internet',
            workPriceCt: 27.99,
            basePriceMonthly: 0,
            monthlyCost: 30,
            annualCost: 360,
            estimatedAnnualSavings: 210,
            bonus: 80,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: false,
            source: 'Versorger Direkt',
            score: 9.5,
            specialFeature: 'Leipziger Kabelnetz mit flexibler 12M Laufzeit',
          },
        ];
      } else {
        // KFZ
        results = [
          {
            id: 'res-kfz-1',
            provider: 'HUK-COBURG',
            tariffName: 'Klassik-Garant KFZ Schutz 2026',
            service: 'kfz',
            workPriceCt: 48.0,
            basePriceMonthly: 0,
            monthlyCost: 48,
            annualCost: 576,
            estimatedAnnualSavings: 240,
            bonus: 50,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: false,
            source: 'CHECK24 Profis',
            score: 9.9,
            specialFeature: 'Deutschlands beliebtester KFZ-Versicherer mit Top-Schadenservice',
          },
          {
            id: 'res-kfz-2',
            provider: 'Allianz Direct',
            tariffName: 'Allianz Direct Komfort Kasko',
            service: 'kfz',
            workPriceCt: 52.0,
            basePriceMonthly: 0,
            monthlyCost: 52,
            annualCost: 624,
            estimatedAnnualSavings: 190,
            bonus: 40,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: false,
            source: 'Verivox Makler',
            score: 9.6,
            specialFeature: 'Erstklassiger Schutzbrief & freie Werkstattwahl',
          },
          {
            id: 'res-kfz-3',
            provider: 'DEVK',
            tariffName: 'DEVK Aktiv-Kasko Leipzig',
            service: 'kfz',
            workPriceCt: 54.0,
            basePriceMonthly: 0,
            monthlyCost: 54,
            annualCost: 648,
            estimatedAnnualSavings: 165,
            bonus: 30,
            priceGuaranteeMonths: 12,
            contractDurationMonths: 12,
            greenEnergy: false,
            source: 'Versorger Direkt',
            score: 9.4,
            specialFeature: 'Persönliche Betreuung & Rabatt für BahnCard-Inhaber',
          },
        ];
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 700);
  };

  // Aktion: Ausgewählten Tarif direkt mit dem Kunden verbinden
  const handleConnectTariffToCustomer = (result: ProviderSearchResult) => {
    if (!selectedCustomer) return;

    const commission =
      result.service === 'strom'
        ? brokerSettings.commissionStrom
        : result.service === 'gas'
        ? brokerSettings.commissionGas
        : result.service === 'internet'
        ? brokerSettings.commissionInternet
        : brokerSettings.commissionKfz;

    const todayStr = new Date().toISOString().split('T')[0];
    const endYear = new Date().getFullYear() + (result.contractDurationMonths >= 24 ? 2 : 1);
    const endStr = `${endYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
      new Date().getDate()
    ).padStart(2, '0')}`;

    const newContract: ContractRecord = {
      id: `ct-makler-${Date.now()}`,
      clientName: selectedCustomer.fullName,
      clientPhone: selectedCustomer.phone,
      clientEmail: selectedCustomer.email,
      service: result.service,
      provider: result.provider,
      tariffName: result.tariffName,
      annualKwh: annualConsumption,
      currentMonthlyInstallment: result.monthlyCost,
      startDate: todayStr,
      durationMonths: result.contractDurationMonths,
      noticePeriodDays: 30,
      endDate: endStr,
      status: 'active',
      provision: commission,
      accountingInvoiceId: `RE-MAK-${Math.floor(100 + Math.random() * 900)}`,
      accountingStatus: 'offen',
      safeInstallmentRecommended: result.monthlyCost,
      backpaymentRisk: 0,
    };

    onConnectContractToCustomer(selectedCustomer.id, newContract, commission);

    setConnectedContractNotice({
      customerName: selectedCustomer.fullName,
      tariff: `${result.provider} · ${result.tariffName}`,
      savings: result.estimatedAnnualSavings,
      commission: commission,
    });
  };

  // Makler-Wechselprotokoll als PDF exportieren
  const exportBrokerOrderPdf = (result: ProviderSearchResult) => {
    if (!selectedCustomer) return;

    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Daryos® – Makler-Wechselauftrag & Bestätigung', 14, 18);
    doc.setFontSize(9);
    doc.text(
      `Vermittler: ${brokerSettings.brokerCompany} | Reg.-Nr: ${brokerSettings.registrationNumber}`,
      14,
      27
    );

    // Kundendaten
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('1. Auftraggeber & Kundendaten', 14, 46);

    doc.setFontSize(10);
    doc.text(`Kunde: ${selectedCustomer.fullName} (${selectedCustomer.customerNumber})`, 14, 54);
    doc.text(`Anschrift: ${selectedCustomer.address || 'Leipzig'}, ${plz} Leipzig`, 14, 61);
    doc.text(`E-Mail: ${selectedCustomer.email} | Tel: ${selectedCustomer.phone}`, 14, 68);

    // Bisheriger Vertrag vs Neuer Vertrag
    doc.setFontSize(12);
    doc.text('2. Tarifoptimierung & Vermittlungsergebnis', 14, 82);

    doc.setFontSize(10);
    doc.text(`Sparte: ${result.service.toUpperCase()}`, 14, 90);
    doc.text(`Bisheriger Anbieter: ${currentProvider} (~${currentMonthlyPaid} € / Monat)`, 14, 97);
    doc.text(`Neuer Ziel-Tarif: ${result.provider} – ${result.tariffName}`, 14, 104);
    doc.text(`Quelle: ${result.source} | Prüf-Score: ${result.score}/10`, 14, 111);
    doc.text(
      `Neuer Abschlag: ca. ${result.monthlyCost} € / Monat | Neuer Jahresgesamtpreis: ${result.annualCost} €`,
      14,
      118
    );
    doc.text(
      `Rechnerische Jahresersparnis: +${result.estimatedAnnualSavings} € / Jahr (inkl. ${result.bonus} € Bonus)`,
      14,
      125
    );
    doc.text(
      `Vertragslaufzeit: ${result.contractDurationMonths} Monate | Preisgarantie: ${result.priceGuaranteeMonths} Monate`,
      14,
      132
    );

    // Vollmacht & Gesetzliche Bestimmungen
    doc.setFontSize(12);
    doc.text('3. Maklervollmacht & Wechselservice-Klausel', 14, 146);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const klauselText =
      'Der Kunde beauftragt Daryos® (Inhaber Daryos Kreis) mit der Einreichung des Wechselauftrags beim Zielversorger sowie der fristgerechten Kündigung des bisherigen Altvertrags. Der Wechselservice ist für den Kunden 100% kostenlos. Die Vergütung erfolgt über die Vermittlungsprovision des jeweiligen Versorgers/Maklerpools gemäß § 34d GewO.';
    const splitKlausel = doc.splitTextToSize(klauselText, 180);
    doc.text(splitKlausel, 14, 154);

    // Unterschriftenzeile
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleDateString('de-DE');
    doc.text(`Leipzig, den ${dateStr}`, 14, 190);
    doc.line(14, 215, 80, 215);
    doc.text('Unterschrift Kunde (Auftraggeber)', 14, 221);

    doc.line(120, 215, 190, 215);
    doc.text('Daryos® Wechselservice Leipzig', 120, 221);

    doc.save(`Daryos_Maklerauftrag_${selectedCustomer.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('daryos_broker_settings', JSON.stringify(brokerSettings));
    } catch (e) {}
    setSaveSettingsNotice(true);
    setTimeout(() => setSaveSettingsNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner mit Schnittstellen-Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>CHECK24 & Makler-Vergleichsplattform</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Makler-Schnittstelle
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kunden auswählen, Anbieterprogramme in Echtzeit durchsuchen, Tarife vergleichen und Vertrag per 1-Klick direkt verbinden.
              </p>
            </div>
          </div>
        </div>

        {/* Status Plaketten der Anbindungen */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CHECK24 Profis:</span>
            <span className="font-mono text-blue-700">{brokerSettings.check24PartnerId}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Verivox:</span>
            <span className="font-mono text-amber-700">{brokerSettings.verivoxPartnerId}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Makler-Einstellungen</span>
          </button>
        </div>
      </div>

      {/* Erfolgsmeldung bei verbundener Tarifzuweisung */}
      {connectedContractNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                Vertrag erfolgreich verbunden & zugeordnet!
              </div>
              <div className="text-xs text-emerald-800">
                Kunde: <strong>{connectedContractNotice.customerName}</strong> · Neuer Tarif: <strong>{connectedContractNotice.tariff}</strong> · Ersparnis: <strong>+{connectedContractNotice.savings} €/Jahr</strong> · Maklerprovision erfasst: <strong>+{connectedContractNotice.commission} €</strong>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-white text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 shadow-2xs">
            Im CRM & Vertragskonto aktiv ✓
          </span>
        </div>
      )}

      {/* Makler-Einstellungen Modal/Drawer */}
      {isSettingsOpen && (
        <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Makler- & Vermittler-Profil konfigurieren</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Schließen ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Makler-Name / Firma</label>
              <input
                type="text"
                value={brokerSettings.brokerCompany}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, brokerCompany: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Vermittlerregister-Nr. (§ 34d GewO)</label>
              <input
                type="text"
                value={brokerSettings.registrationNumber}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">CHECK24 Partner-ID</label>
              <input
                type="text"
                value={brokerSettings.check24PartnerId}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, check24PartnerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Verivox Makler-ID</label>
              <input
                type="text"
                value={brokerSettings.verivoxPartnerId}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, verivoxPartnerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Provision Strom (€/Wechsel)</label>
              <input
                type="number"
                value={brokerSettings.commissionStrom}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, commissionStrom: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Provision Gas (€/Wechsel)</label>
              <input
                type="number"
                value={brokerSettings.commissionGas}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, commissionGas: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {saveSettingsNotice ? '✓ Einstellungen erfolgreich gespeichert!' : 'Daten werden lokal & sicher für Wechselfälle hinterlegt.'}
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Einstellungen speichern
            </button>
          </div>
        </form>
      )}

      {/* 2. Steuerungsbereich: Kunde wählen & Abfrage konfigurieren */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Kunde für Tarifoptimierung auswählen
            </h4>
          </div>

          {/* Kunden Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Kunde:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {crmContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.customerNumber} · {c.city || 'Leipzig'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ausgewählter Kunde Profil-Banner */}
        {selectedCustomer && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">Name & Anschrift</span>
              <span className="font-bold text-slate-800">{selectedCustomer.fullName}</span>
              <span className="text-slate-500 text-[11px] block">{selectedCustomer.address || 'Rotfuchsstr. 1'}, {plz}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Kontakt</span>
              <span className="font-bold text-slate-800">{selectedCustomer.phone}</span>
              <span className="text-slate-500 text-[11px] block truncate">{selectedCustomer.email}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Bestehende Verträge</span>
              <span className="font-bold text-blue-700">{selectedCustomer.contracts.length} Vertrag / Verträge</span>
              <span className="text-slate-500 text-[11px] block">
                {selectedCustomer.contracts.map((c) => c.provider).join(', ') || 'Keine Verträge'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Bisherige Jahresersparnis</span>
              <span className="font-bold text-emerald-600">+{selectedCustomer.totalAnnualSavingsCalculated} € / Jahr</span>
              <span className="text-slate-500 text-[11px] block">Status: {selectedCustomer.status}</span>
            </div>
          </div>
        )}

        {/* 3. Abfrage-Parameter: Sparte & Tarif-Kriterien */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {/* Sparte */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Sparte wählen</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveService('strom')}
                className={`py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  activeService === 'strom' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Stromvergleich"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveService('gas')}
                className={`py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  activeService === 'gas' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Gasvergleich"
              >
                <Flame className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveService('internet')}
                className={`py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  activeService === 'internet' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Internet / Glasfaser"
              >
                <Wifi className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveService('kfz')}
                className={`py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  activeService === 'kfz' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="KFZ-Versicherung"
              >
                <Car className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PLZ */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Postleitzahl</label>
            <input
              type="text"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              placeholder="z.B. 04315"
            />
          </div>

          {/* Jahresverbrauch */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              {activeService === 'strom' || activeService === 'gas' ? 'Verbrauch (kWh/Jahr)' : 'Aktueller Beitrag (€/M)'}
            </label>
            <input
              type="number"
              value={annualConsumption}
              onChange={(e) => setAnnualConsumption(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            />
          </div>

          {/* Bisheriger Abschlag */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Aktueller Abschlag (€/M)</label>
            <input
              type="number"
              value={currentMonthlyPaid}
              onChange={(e) => setCurrentMonthlyPaid(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            />
          </div>

          {/* Such-Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePerformBrokerSearch}
              disabled={isSearching}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Schnittstelle sucht...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Tarife abfragen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Gefundene Makler-Tarife & Live-Vergleich */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              Vergleichsergebnisse über CHECK24-, Verivox- & Direktanbieter-Programme ({searchResults.length})
            </span>
          </h4>

          {searchResults.length > 0 && (
            <span className="text-xs text-slate-500">
              Geprüft für PLZ {plz} · Verbrauch {annualConsumption.toLocaleString('de-DE')} kWh
            </span>
          )}
        </div>

        {searchResults.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Search className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-800">Noch keine Abfrage gestartet</h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Wählen Sie oben den Kunden aus und klicken Sie auf <strong>„Tarife abfragen“</strong>, um alle aktuellen Angebote über CHECK24 Profis und die Maklerschnittstellen zu laden.
            </p>
            <button
              type="button"
              onClick={handlePerformBrokerSearch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Jetzt Tarife für {selectedCustomer?.fullName || 'Kunde'} abfragen</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {searchResults.map((result, idx) => (
              <div
                key={result.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs space-y-3"
              >
                {/* Obere Zeile: Rang, Anbieter, Quelle & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <span>{result.provider}</span>
                        <span className="text-xs font-semibold text-slate-600 font-sans">
                          · {result.tariffName}
                        </span>
                        {result.greenEnergy && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            100% Öko
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Quelle: <strong>{result.source}</strong></span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{result.specialFeature}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900">
                        Score: {result.score} / 10
                      </div>
                      <div className="text-[10px] text-slate-400">Geprüfte Tarifqualität</div>
                    </div>
                  </div>
                </div>

                {/* Mittlere Zeile: Tarifdaten & Kostendetails */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Arbeitspreis / Grundpreis</span>
                    <span className="font-bold text-slate-800">
                      {result.workPriceCt} ct/kWh
                    </span>
                    <span className="text-slate-500 text-[11px] block">
                      +{result.basePriceMonthly} € / Monat
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block">Laufzeit & Garantie</span>
                    <span className="font-bold text-slate-800">
                      {result.contractDurationMonths} Monate Laufzeit
                    </span>
                    <span className="text-blue-700 text-[11px] font-semibold block">
                      {result.priceGuaranteeMonths}M Preisgarantie
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block">Neuer Monatsabschlag</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {result.monthlyCost} € <span className="text-xs font-normal text-slate-500">/ M.</span>
                    </span>
                    <span className="text-slate-500 text-[10px] block">
                      Gesamt: {result.annualCost} € / Jahr
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 text-[10px] font-bold block">
                      Rechnerische Ersparnis p.a.
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      +{result.estimatedAnnualSavings} €
                    </span>
                    <span className="text-emerald-800 text-[10px] font-medium block">
                      inkl. {result.bonus} € Wechselbonus
                    </span>
                  </div>
                </div>

                {/* Untere Zeile: Makler-Aktionen */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-bold text-blue-700">
                      Maklerprovision:{' '}
                      {result.service === 'strom'
                        ? brokerSettings.commissionStrom
                        : result.service === 'gas'
                        ? brokerSettings.commissionGas
                        : result.service === 'internet'
                        ? brokerSettings.commissionInternet
                        : brokerSettings.commissionKfz}{' '}
                      €
                    </span>
                    <span>·</span>
                    <span className="text-slate-500">
                      Automatischer Kündigungsservice & Wechselauftrag inklusive
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportBrokerOrderPdf(result)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Offiziellen Makler-Wechselauftrag als PDF herunterladen"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Auftrag PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConnectTariffToCustomer(result)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                      title="Diesen Tarif direkt mit dem Kunden verbinden und im CRM aktivieren"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Vertrag mit {selectedCustomer?.fullName.split(' ')[0] || 'Kunde'} verbinden</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
