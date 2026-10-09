import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Zap,
  Flame,
  Wifi,
  Car,
  Check,
  RefreshCw,
  MessageSquare,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  TrendingDown,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Language, ServiceType } from '../types';
import { translations } from '../data/translations';
import { ProviderLogo } from './ProviderLogos';
import {
  getRegionInfoForPlz,
  STROM_PROVIDER_TARIFFS,
  GAS_PROVIDER_TARIFFS,
  INTERNET_PROVIDER_TARIFFS,
  KFZ_PROVIDER_TARIFFS,
  ProviderTariffDetail,
} from '../data/plzTarifData';

interface CalculatorProps {
  currentLang: Language;
  onApplySavingsToBooking: (service: ServiceType, savingsText: string) => void;
}

export const CalculatorComponent: React.FC<CalculatorProps> = ({
  currentLang,
  onApplySavingsToBooking,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<ServiceType>('gas');

  // Postleitzahl (PLZ) state - Standard ist Leipzig 04329 (Daryos Firmensitz)
  const [plz, setPlz] = useState<string>('04329');

  // Zeit / Vertragslaufzeit & Preisgarantie (12 Monate, 24 Monate oder flexibel 1 Monat)
  const [laufzeitOption, setLaufzeitOption] = useState<'12' | '24' | 'flex'>('12');

  // Strom states
  const [stromPersons, setStromPersons] = useState<number>(2);
  const [stromKwh, setStromKwh] = useState<number>(2500);
  const [stromCurrentRate, setStromCurrentRate] = useState<number>(90);
  const [selectedStromTariffId, setSelectedStromTariffId] = useState<string>('vattenfall');

  // Gas states (Defaulting to 80m² / 12.000 kWh with realistic German price)
  const [gasSqm, setGasSqm] = useState<number>(80);
  const [gasKwh, setGasKwh] = useState<number>(12000);
  const [gasCurrentRate, setGasCurrentRate] = useState<number>(155);
  const [selectedGasTariffId, setSelectedGasTariffId] = useState<string>('montana');

  // Internet states
  const [internetCurrentSpeed, setInternetCurrentSpeed] = useState<number>(50);
  const [internetCurrentPrice, setInternetCurrentPrice] = useState<number>(45);
  const [internetGoal, setInternetGoal] = useState<'dsl' | 'glasfaser' | 'kabel'>('glasfaser');
  const [selectedInternetTariffId, setSelectedInternetTariffId] = useState<string>('pyur');

  // KFZ states
  const [kfzSf, setKfzSf] = useState<number>(10);
  const [kfzCoverage, setKfzCoverage] = useState<'haftpflicht' | 'teilkasko' | 'vollkasko'>('vollkasko');
  const [kfzCurrentAnnual, setKfzCurrentAnnual] = useState<number>(680);
  const [selectedKfzTariffId, setSelectedKfzTariffId] = useState<string>('huk-coburg');

  // Dynamische Regions-Erkennung anhand der eingegebenen Postleitzahl
  const regionInfo = useMemo(() => {
    return getRegionInfoForPlz(plz);
  }, [plz]);

  // Laufzeit-Korrekturfaktor für den Arbeitspreis
  // (12 Monate = bester Marktpreis/Wechselbonus, 24 Monate = geringer Aufschlag für Preissicherheit, flex = Flexibilitätsaufschlag)
  const laufzeitFactor = useMemo(() => {
    if (laufzeitOption === '24') return 1.04;
    if (laufzeitOption === 'flex') return 1.09;
    return 1.0; // 12 Monate Standard
  }, [laufzeitOption]);

  // Aktuell ausgewählter Anbieter-Tarif je Sparte
  const currentStromTariff = useMemo<ProviderTariffDetail>(() => {
    const found = STROM_PROVIDER_TARIFFS.find((t) => t.id === selectedStromTariffId);
    return found || STROM_PROVIDER_TARIFFS[0];
  }, [selectedStromTariffId]);

  const currentGasTariff = useMemo<ProviderTariffDetail>(() => {
    const found = GAS_PROVIDER_TARIFFS.find((t) => t.id === selectedGasTariffId);
    return found || GAS_PROVIDER_TARIFFS[0];
  }, [selectedGasTariffId]);

  const currentInternetTariff = useMemo<ProviderTariffDetail>(() => {
    const found = INTERNET_PROVIDER_TARIFFS.find((t) => t.id === selectedInternetTariffId);
    return found || INTERNET_PROVIDER_TARIFFS[0];
  }, [selectedInternetTariffId]);

  const currentKfzTariff = useMemo<ProviderTariffDetail>(() => {
    const found = KFZ_PROVIDER_TARIFFS.find((t) => t.id === selectedKfzTariffId);
    return found || KFZ_PROVIDER_TARIFFS[0];
  }, [selectedKfzTariffId]);

  // Presets handler for Strom
  const handleStromPersonsChange = (p: number) => {
    setStromPersons(p);
    const kwhMap: Record<number, number> = { 1: 1500, 2: 2500, 3: 3500, 4: 4500 };
    const defaultKwh = kwhMap[p] || 2500;
    setStromKwh(defaultKwh);
    // Realistischer Grundversorger-Abschlag anhand der PLZ-Region
    const gvArbeitspreis = regionInfo.grundversorgerStrom.arbeitspreis / 100;
    const gvGrundpreis = regionInfo.grundversorgerStrom.grundpreis;
    const estPayment = Math.round((defaultKwh * gvArbeitspreis + gvGrundpreis * 12) / 12);
    setStromCurrentRate(estPayment);
  };

  const handleStromKwhChange = (kwh: number) => {
    setStromKwh(kwh);
    const gvArbeitspreis = regionInfo.grundversorgerStrom.arbeitspreis / 100;
    const gvGrundpreis = regionInfo.grundversorgerStrom.grundpreis;
    const estPayment = Math.round((kwh * gvArbeitspreis + gvGrundpreis * 12) / 12);
    setStromCurrentRate(estPayment);
  };

  // Presets handler for Gas
  const handleGasSqmChange = (sqm: number) => {
    setGasSqm(sqm);
    const kwhMap: Record<number, number> = { 50: 7500, 80: 12000, 120: 18000, 160: 24000 };
    const estKwh = kwhMap[sqm] || sqm * 150;
    setGasKwh(estKwh);
    // Realistischer Grundversorger-Abschlag anhand der PLZ-Region
    const gvArbeitspreis = regionInfo.grundversorgerGas.arbeitspreis / 100;
    const gvGrundpreis = regionInfo.grundversorgerGas.grundpreis;
    const estPayment = Math.round((estKwh * gvArbeitspreis + gvGrundpreis * 12) / 12);
    setGasCurrentRate(estPayment);
  };

  const handleGasKwhChange = (kwh: number) => {
    setGasKwh(kwh);
    const gvArbeitspreis = regionInfo.grundversorgerGas.arbeitspreis / 100;
    const gvGrundpreis = regionInfo.grundversorgerGas.grundpreis;
    const estPayment = Math.round((kwh * gvArbeitspreis + gvGrundpreis * 12) / 12);
    setGasCurrentRate(estPayment);
  };

  // The calculator uses illustrative prices stored in the app, not live provider quotes.

  const calculateStromSavings = () => {
    const annualCurrent = Math.max(120, stromCurrentRate * 12);
    // Exakter Preis des gewählten Anbieters unter Berücksichtigung von Laufzeit & Arbeitspreis
    const effArbeitspreis = currentStromTariff.arbeitspreis * laufzeitFactor;
    const optimizedAnnual = Math.round(
      stromKwh * (effArbeitspreis / 100) + currentStromTariff.grundpreis * 12
    );

    const savings = Math.max(0, annualCurrent - optimizedAnnual);
    const finalOptimized = optimizedAnnual;

    return {
      annualCurrent,
      optimizedAnnual: finalOptimized,
      savings,
      monthlyOptimized: Math.round(finalOptimized / 12),
      effectiveArbeitspreis: Number(effArbeitspreis.toFixed(2)),
      effectiveGrundpreis: currentStromTariff.grundpreis,
    };
  };

  const calculateGasSavings = () => {
    const annualCurrent = Math.max(300, gasCurrentRate * 12);
    const effArbeitspreis = currentGasTariff.arbeitspreis * laufzeitFactor;
    const optimizedAnnual = Math.round(
      gasKwh * (effArbeitspreis / 100) + currentGasTariff.grundpreis * 12
    );

    const savings = Math.max(0, annualCurrent - optimizedAnnual);
    const finalOptimized = optimizedAnnual;

    return {
      annualCurrent,
      optimizedAnnual: finalOptimized,
      savings,
      monthlyOptimized: Math.round(finalOptimized / 12),
      effectiveArbeitspreis: Number(effArbeitspreis.toFixed(2)),
      effectiveGrundpreis: currentGasTariff.grundpreis,
    };
  };

  const calculateInternetSavings = () => {
    const annualCurrent = internetCurrentPrice * 12;
    const monthlyRate = currentInternetTariff.arbeitspreis;
    const optimizedAnnual = Math.round(monthlyRate * 12);

    const savings = Math.max(0, annualCurrent - optimizedAnnual);
    const finalOptimized = optimizedAnnual;

    return {
      annualCurrent,
      optimizedAnnual: finalOptimized,
      savings,
      monthlyOptimized: Math.round(finalOptimized / 12),
      effectiveArbeitspreis: monthlyRate,
      effectiveGrundpreis: 0,
    };
  };

  const calculateKfzSavings = () => {
    const annualCurrent = kfzCurrentAnnual;
    // Basis-Beitrag des gewählten KFZ-Versicherers, korrigiert um Schadenfreiheitsklasse & Deckung
    const sfFactor = Math.max(0.35, 1 - kfzSf * 0.025);
    const covFactor = kfzCoverage === 'vollkasko' ? 1.0 : kfzCoverage === 'teilkasko' ? 0.75 : 0.55;
    const calculatedAnnual = Math.round(currentKfzTariff.arbeitspreis * sfFactor * covFactor);

    const savings = Math.max(0, annualCurrent - calculatedAnnual);
    const finalOptimized = calculatedAnnual;

    return {
      annualCurrent,
      optimizedAnnual: finalOptimized,
      savings,
      monthlyOptimized: Math.round(finalOptimized / 12),
      effectiveArbeitspreis: finalOptimized,
      effectiveGrundpreis: 0,
    };
  };

  let currentResult = {
    annualCurrent: 0,
    optimizedAnnual: 0,
    savings: 0,
    monthlyOptimized: 0,
    effectiveArbeitspreis: 0,
    effectiveGrundpreis: 0,
  };
  let serviceLabel = '';
  let activeProviderTariff: ProviderTariffDetail = currentStromTariff;

  if (activeTab === 'strom') {
    currentResult = calculateStromSavings();
    serviceLabel = 'Strom';
    activeProviderTariff = currentStromTariff;
  } else if (activeTab === 'gas') {
    currentResult = calculateGasSavings();
    serviceLabel = 'Gas';
    activeProviderTariff = currentGasTariff;
  } else if (activeTab === 'internet') {
    currentResult = calculateInternetSavings();
    serviceLabel = 'Internet';
    activeProviderTariff = currentInternetTariff;
  } else if (activeTab === 'kfz') {
    currentResult = calculateKfzSavings();
    serviceLabel = 'KFZ-Versicherung';
    activeProviderTariff = currentKfzTariff;
  }

  const handleApply = () => {
    const savingsText = `${currentResult.savings} € / Jahr bei ${serviceLabel} (PLZ ${plz}, Anbieter: ${activeProviderTariff.providerName})`;
    onApplySavingsToBooking(activeTab, savingsText);
  };

  const shareViaWhatsApp = () => {
    const text = `Hallo Daryos, ich habe eine unverbindliche Beispielrechnung für ${serviceLabel} und PLZ ${plz} erstellt. Sie basiert auf hinterlegten Beispielpreisen und ist kein Live-Angebot. Bitte prüfen Sie verfügbare Angebote Ihrer Vertragspartner für mich.`;
    window.open(`https://wa.me/4917643416174?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="calculator" className="py-20 bg-[#07070a] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Unverbindliche Beispielrechnung – keine Live-Angebote</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.calculator.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Diese Beispielrechnung nutzt hinterlegte Tarifwerte, keine aktuellen Live-Angebote. Tatsächliche Preise, Verfügbarkeit und Leistungen prüft Daryos individuell mit seinen Vertragspartnern.
          </p>
        </div>

        {/* Global Parameter Bar: PLZ & Vertragslaufzeit */}
        <div className="max-w-4xl mx-auto mb-8 bg-[#0d0e14] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* PLZ Input */}
            <div className="md:col-span-5 space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Ihre Postleitzahl (PLZ)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={5}
                  value={plz}
                  onChange={(e) => setPlz(e.target.value.replace(/\D/g, ''))}
                  placeholder="z.B. 04329 Leipzig"
                  className="w-full pl-3 pr-24 py-2.5 bg-[#14151e] border border-white/[0.1] rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-blue-400 pointer-events-none truncate max-w-[120px]">
                  {regionInfo.cityName}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                <span>Region:</span>
                <span className="text-slate-300 font-medium">{regionInfo.region}</span>
              </div>
            </div>

            {/* Laufzeit & Preisgarantie */}
            <div className="md:col-span-7 space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Vertragslaufzeit & Preisgarantie</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLaufzeitOption('12')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                    laufzeitOption === '12'
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-xs'
                      : 'bg-[#14151e] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">12 Monate</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Laufzeit-Beispiel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLaufzeitOption('24')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                    laufzeitOption === '24'
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-xs'
                      : 'bg-[#14151e] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">24 Monate</span>
                  <span className="text-[9px] text-slate-400 font-mono">Langzeit-Schutz</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLaufzeitOption('flex')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                    laufzeitOption === 'flex'
                      ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 shadow-xs'
                      : 'bg-[#14151e] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">Monatlich flex</span>
                  <span className="text-[9px] text-amber-400 font-mono">Ohne Bindung</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>
                  {laufzeitOption === '12'
                    ? '12 Monate Laufzeit (Beispiel)'
                    : laufzeitOption === '24'
                    ? '24 Monate planbare Budgetsicherheit'
                    : '1 Monat Kündigungsfrist, flexibel anpassbar'}
                </span>
              </div>
            </div>

          </div>

          {/* Regionaler Grundversorger-Hinweis */}
          <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Lokaler Grundversorger für PLZ <strong>{plz || '04329'}</strong>:
              </span>
              <span className="text-white font-semibold">
                {activeTab === 'strom'
                  ? regionInfo.grundversorgerStrom.name
                  : activeTab === 'gas'
                  ? regionInfo.grundversorgerGas.name
                  : activeTab === 'internet'
                  ? 'Regionales Breitband- & Kabelnetz'
                  : 'Regionale KFZ-Tarifstruktur'}
              </span>
            </div>

            {(activeTab === 'strom' || activeTab === 'gas') && (
              <div className="text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                Grundversorgung Basispreis:{' '}
                <strong className="text-amber-400">
                  {activeTab === 'strom'
                    ? `${regionInfo.grundversorgerStrom.arbeitspreis} ct/kWh`
                    : `${regionInfo.grundversorgerGas.arbeitspreis} ct/kWh`}
                </strong>
                {' · '}
                <span>
                  {activeTab === 'strom'
                    ? `${regionInfo.grundversorgerStrom.grundpreis.toFixed(2)} €/M.`
                    : `${regionInfo.grundversorgerGas.grundpreis.toFixed(2)} €/M.`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-[#0f1015] rounded-xl border border-white/[0.08] flex-wrap justify-center gap-1">
            <button
              onClick={() => setActiveTab('strom')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'strom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-blue-300" />
              <span>{t.calculator.tabStrom}</span>
            </button>

            <button
              onClick={() => setActiveTab('gas')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'gas'
                  ? 'bg-orange-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-300" />
              <span>{t.calculator.tabGas}</span>
            </button>

            <button
              onClick={() => setActiveTab('internet')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'internet'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4 text-blue-300" />
              <span>{t.calculator.tabInternet}</span>
            </button>

            <button
              onClick={() => setActiveTab('kfz')}
              className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'kfz'
                  ? 'bg-emerald-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 text-emerald-300" />
              <span>{t.calculator.tabKfz}</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Panel */}
          <div className="lg:col-span-7 bg-[#0b0c10] p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl space-y-6">
            
            {/* STROM TAB */}
            {activeTab === 'strom' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.calculator.stromPersons}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleStromPersonsChange(num)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                          stromPersons === num
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                            : 'bg-[#121319] border-white/[0.06] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {num} {num === 4 ? '+ Pers.' : 'Pers.'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.stromOrKwh}</span>
                    <span className="text-blue-400 font-mono tabular-nums font-bold">
                      {stromKwh.toLocaleString()} kWh / Jahr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="7000"
                    step="100"
                    value={stromKwh}
                    onChange={(e) => handleStromKwhChange(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>1.000 kWh (Single)</span>
                    <span>2.500 kWh (Paar)</span>
                    <span>4.500 kWh (Familie)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.currentMonthlyRate}</span>
                    <span className="text-blue-400 font-mono tabular-nums font-bold">
                      {stromCurrentRate} € / Monat
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="280"
                    step="5"
                    value={stromCurrentRate}
                    onChange={(e) => setStromCurrentRate(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Aktuelle Jahreskosten: {(stromCurrentRate * 12).toLocaleString()} €</span>
                    <span className="text-slate-400">Tipp: Auf Ihrer letzten Abrechnung ablesbar</span>
                  </div>
                </div>

                {/* Echte Anbieterfirmen zur Auswahl */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Empfohlene Top-Anbieter für PLZ {plz}:
                    </span>
                    <span className="text-[11px] text-slate-400">Klick zum Tarifvergleich</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STROM_PROVIDER_TARIFFS.map((tariff) => {
                      const isSelected = selectedStromTariffId === tariff.id;
                      return (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => setSelectedStromTariffId(tariff.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500/70 shadow-xs ring-1 ring-blue-500/30'
                              : 'bg-[#121319] border-white/[0.06] hover:border-white/[0.15]'
                          }`}
                        >
                          <ProviderLogo id={tariff.id} size="sm" variant="dark" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{tariff.providerName}</span>
                              {tariff.eco && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                                  Öko
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tariff.tariffName}
                            </div>
                            <div className="text-[10px] font-mono text-blue-300 mt-0.5">
                              {tariff.arbeitspreis} ct/kWh · {tariff.grundpreis.toFixed(2)} €/M.
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* GAS TAB */}
            {activeTab === 'gas' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.calculator.gasArea}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 80, 120, 160].map((sqm) => (
                      <button
                        key={sqm}
                        type="button"
                        onClick={() => handleGasSqmChange(sqm)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                          gasSqm === sqm
                            ? 'bg-orange-600/20 border-orange-500/60 text-orange-300'
                            : 'bg-[#121319] border-white/[0.06] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sqm} m²
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.gasConsumption}</span>
                    <span className="text-orange-400 font-mono tabular-nums font-bold">
                      {gasKwh.toLocaleString()} kWh / Jahr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4000"
                    max="30000"
                    step="500"
                    value={gasKwh}
                    onChange={(e) => handleGasKwhChange(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>7.500 kWh (50m²)</span>
                    <span>12.000 kWh (80m²)</span>
                    <span>24.000 kWh (Haus)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.currentMonthlyRate}</span>
                    <span className="text-orange-400 font-mono tabular-nums font-bold">
                      {gasCurrentRate} € / Monat
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="450"
                    step="5"
                    value={gasCurrentRate}
                    onChange={(e) => setGasCurrentRate(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Aktuelle Jahreskosten: {(gasCurrentRate * 12).toLocaleString()} €</span>
                    <span className="text-slate-400">Vergleich mit Gasrechnung</span>
                  </div>
                </div>

                {/* Echte Gasanbieter zur Auswahl */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Empfohlene Top-Gasanbieter für PLZ {plz}:
                    </span>
                    <span className="text-[11px] text-slate-400">Klick zum Tarifvergleich</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GAS_PROVIDER_TARIFFS.map((tariff) => {
                      const isSelected = selectedGasTariffId === tariff.id;
                      return (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => setSelectedGasTariffId(tariff.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-orange-600/15 border-orange-500/70 shadow-xs ring-1 ring-orange-500/30'
                              : 'bg-[#121319] border-white/[0.06] hover:border-white/[0.15]'
                          }`}
                        >
                          <ProviderLogo id={tariff.id} size="sm" variant="dark" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{tariff.providerName}</span>
                              {tariff.regionalLeipzig && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-normal">
                                  Leipzig
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tariff.tariffName}
                            </div>
                            <div className="text-[10px] font-mono text-orange-300 mt-0.5">
                              {tariff.arbeitspreis} ct/kWh · {tariff.grundpreis.toFixed(2)} €/M.
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* INTERNET TAB */}
            {activeTab === 'internet' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.calculator.internetType}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['glasfaser', 'dsl', 'kabel'] as const).map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => setInternetGoal(tech)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border capitalize cursor-pointer ${
                          internetGoal === tech
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                            : 'bg-[#121319] border-white/[0.06] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tech === 'glasfaser' ? 'Glasfaser (FTTH)' : tech === 'dsl' ? 'VDSL Highspeed' : 'Kabel Internet'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.internetSpeed}</span>
                    <span className="text-blue-400 font-mono tabular-nums font-bold">
                      {internetCurrentSpeed} Mbit/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="500"
                    step="10"
                    value={internetCurrentSpeed}
                    onChange={(e) => setInternetCurrentSpeed(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>Aktueller Monatsbetrag</span>
                    <span className="text-blue-400 font-mono tabular-nums font-bold">
                      {internetCurrentPrice} € / Monat
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    step="1"
                    value={internetCurrentPrice}
                    onChange={(e) => setInternetCurrentPrice(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Aktuelle Jahreskosten: {(internetCurrentPrice * 12).toLocaleString()} €
                  </div>
                </div>

                {/* Echte Internetanbieter zur Auswahl */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Verfügbare Top-Netzanbieter für PLZ {plz}:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INTERNET_PROVIDER_TARIFFS.map((tariff) => {
                      const isSelected = selectedInternetTariffId === tariff.id;
                      return (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => setSelectedInternetTariffId(tariff.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500/70 shadow-xs ring-1 ring-blue-500/30'
                              : 'bg-[#121319] border-white/[0.06] hover:border-white/[0.15]'
                          }`}
                        >
                          <ProviderLogo id={tariff.id} size="sm" variant="dark" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">
                              {tariff.providerName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tariff.tariffName}
                            </div>
                            <div className="text-[10px] font-mono text-blue-300 mt-0.5">
                              Ø {tariff.arbeitspreis.toFixed(2)} € / Monat
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* KFZ TAB */}
            {activeTab === 'kfz' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.calculator.kfzCoverage}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['haftpflicht', 'teilkasko', 'vollkasko'] as const).map((cov) => (
                      <button
                        key={cov}
                        type="button"
                        onClick={() => setKfzCoverage(cov)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors border capitalize cursor-pointer ${
                          kfzCoverage === cov
                            ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300'
                            : 'bg-[#121319] border-white/[0.06] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cov === 'haftpflicht' ? 'Haftpflicht' : cov === 'teilkasko' ? 'Teilkasko' : 'Vollkasko'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.kfzClass}</span>
                    <span className="text-emerald-400 font-mono tabular-nums font-bold">
                      SF {kfzSf}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="1"
                    value={kfzSf}
                    onChange={(e) => setKfzSf(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>Aktueller Jahresbeitrag (€)</span>
                    <span className="text-emerald-400 font-mono tabular-nums font-bold">
                      {kfzCurrentAnnual} € / Jahr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="1800"
                    step="20"
                    value={kfzCurrentAnnual}
                    onChange={(e) => setKfzCurrentAnnual(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Echte KFZ-Versicherer zur Auswahl */}
                <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Empfohlene KFZ-Versicherer für PLZ {plz}:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {KFZ_PROVIDER_TARIFFS.map((tariff) => {
                      const isSelected = selectedKfzTariffId === tariff.id;
                      return (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => setSelectedKfzTariffId(tariff.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-emerald-600/15 border-emerald-500/70 shadow-xs ring-1 ring-emerald-500/30'
                              : 'bg-[#121319] border-white/[0.06] hover:border-white/[0.15]'
                          }`}
                        >
                          <ProviderLogo id={tariff.id} size="sm" variant="dark" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">
                              {tariff.providerName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tariff.tariffName}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-300 mt-0.5">
                              {tariff.description.slice(0, 40)}...
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Indicative estimate based on locally stored sample prices */}
          <div className="lg:col-span-5 bg-[#0b0c10] p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{t.calculator.resultTitle}</span>
                </span>
                <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Beispielwerte</span>
                </span>
              </div>

              {/* Big Savings Callout */}
              <div className="p-5 bg-[#121319] rounded-xl border border-white/[0.06]">
                <div className="text-xs text-slate-400 mb-1">
                  {t.calculator.estimatedSavings}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tabular-nums">
                    {currentResult.savings.toLocaleString('de-DE')} €
                  </span>
                  <span className="text-slate-400 text-sm font-medium">
                    {t.calculator.perYear}
                  </span>
                </div>

                <div className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Unverbindliche Rechendifferenz, kein Tarifangebot</span>
                </div>

                <div className="text-[11px] text-blue-200 font-medium mt-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 space-y-1">
                  <div className="leading-relaxed text-slate-300">
                    Rechnerischer Monatsbetrag nach den hinterlegten Beispielwerten:{' '}
                    <strong className="text-white font-mono font-bold">
                      {currentResult.monthlyOptimized} € / Monat
                    </strong>
                    . Tatsächliche Preise und Abschläge können abweichen.
                  </div>
                </div>
              </div>

              {/* Illustrative provider and tariff details */}
              <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Beispielanbieter und -tarif:</span>
                </div>

                <div className="flex items-center gap-3">
                  <ProviderLogo id={activeProviderTariff.id} size="md" variant="dark" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {activeProviderTariff.providerName}
                    </div>
                    <div className="text-xs text-blue-300 truncate">
                      {activeProviderTariff.tariffName}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {activeProviderTariff.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-white/[0.06]">
                  <div>
                    <span className="text-slate-500 block">Arbeitspreis:</span>
                    <strong className="text-slate-200 font-mono">
                      {activeTab === 'strom' || activeTab === 'gas'
                        ? `${currentResult.effectiveArbeitspreis} ct/kWh`
                        : `${currentResult.effectiveArbeitspreis} €/Monat`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Grundpreis / Frist:</span>
                    <strong className="text-slate-200 font-mono">
                      {activeTab === 'strom' || activeTab === 'gas'
                        ? `${currentResult.effectiveGrundpreis.toFixed(2)} €/Monat`
                        : `${activeProviderTariff.kuendigungsfristWochen} Wochen Frist`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Example cost comparison */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.calculator.previousAnnualCosts}</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {currentResult.annualCurrent.toLocaleString('de-DE')} €
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.calculator.optimizedAnnualCosts}</span>
                  <span className="font-mono tabular-nums text-blue-400 font-semibold">
                    {currentResult.optimizedAnnual.toLocaleString('de-DE')} €
                  </span>
                </div>

                {/* Progress bar visualizing the difference */}
                <div className="w-full h-2.5 bg-[#181920] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          20,
                          (currentResult.optimizedAnnual / (currentResult.annualCurrent || 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Die regionale Einordnung und alle Tarifwerte sind Beispiele, keine aktuellen Anbieterangebote. Ein Wechselservice wird individuell besprochen.
              </p>
            </div>

            {/* Actions for this savings calculation */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleApply}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{t.calculator.takeToBooking}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={shareViaWhatsApp}
                className="w-full py-2.5 px-4 bg-[#14151c] hover:bg-[#1a1b24] text-slate-200 border border-white/[0.08] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Angebot per WhatsApp anfordern</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
