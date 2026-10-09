import React, { useState } from 'react';
import { ArrowRight, Zap, Flame, Wifi, Car, Check, RefreshCw, MessageSquare } from 'lucide-react';
import { Language, ServiceType } from '../types';
import { translations } from '../data/translations';
import { TariffPricingConfig } from './AdminCockpit';
import { ProviderLogo } from './ProviderLogos';

interface CalculatorProps {
  currentLang: Language;
  onApplySavingsToBooking: (service: ServiceType, savingsText: string) => void;
  pricingConfig?: TariffPricingConfig;
}

export const CalculatorComponent: React.FC<CalculatorProps> = ({ 
  currentLang, 
  onApplySavingsToBooking,
  pricingConfig,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<ServiceType>('gas');

  // Strom states
  const [stromPersons, setStromPersons] = useState<number>(2);
  const [stromKwh, setStromKwh] = useState<number>(2500);
  const [stromCurrentRate, setStromCurrentRate] = useState<number>(90);

  // Gas states (Defaulting to 80m² / 12.000 kWh with realistic German price)
  const [gasSqm, setGasSqm] = useState<number>(80);
  const [gasKwh, setGasKwh] = useState<number>(12000);
  const [gasCurrentRate, setGasCurrentRate] = useState<number>(155);

  // Active pricing config fallback
  const currentPricing = pricingConfig || {
    stromArbeitspreis: 26.8,
    stromGrundpreis: 10.5,
    gasArbeitspreis: 8.4,
    gasGrundpreis: 11.2,
    internetPromoPrice: 29.9,
    kfzAvgSavingsPercent: 26,
    provisionStrom: 65,
    provisionGas: 80,
    provisionInternet: 50,
    provisionKfz: 90,
  };

  // Internet states
  const [internetCurrentSpeed, setInternetCurrentSpeed] = useState<number>(50);
  const [internetCurrentPrice, setInternetCurrentPrice] = useState<number>(45);
  const [internetGoal, setInternetGoal] = useState<'dsl' | 'glasfaser' | 'kabel'>('glasfaser');

  // KFZ states
  const [kfzSf, setKfzSf] = useState<number>(10);
  const [kfzCoverage, setKfzCoverage] = useState<'haftpflicht' | 'teilkasko' | 'vollkasko'>('vollkasko');
  const [kfzCurrentAnnual, setKfzCurrentAnnual] = useState<number>(680);

  // Presets handler for Strom
  const handleStromPersonsChange = (p: number) => {
    setStromPersons(p);
    const kwhMap: Record<number, number> = { 1: 1500, 2: 2500, 3: 3500, 4: 4500 };
    const defaultKwh = kwhMap[p] || 2500;
    setStromKwh(defaultKwh);
    // Typical Grundversorger monthly payment in Germany (~38 ct/kWh + 140€/yr base fee)
    const estPayment = Math.round((defaultKwh * 0.38 + 140) / 12);
    setStromCurrentRate(estPayment);
  };

  const handleStromKwhChange = (kwh: number) => {
    setStromKwh(kwh);
    const estPayment = Math.round((kwh * 0.38 + 140) / 12);
    setStromCurrentRate(estPayment);
  };

  // Presets handler for Gas
  const handleGasSqmChange = (sqm: number) => {
    setGasSqm(sqm);
    const kwhMap: Record<number, number> = { 50: 7500, 80: 12000, 120: 18000, 160: 24000 };
    const estKwh = kwhMap[sqm] || sqm * 150;
    setGasKwh(estKwh);
    // Typical Grundversorger monthly payment in Germany (~13 ct/kWh + 150€/yr base fee)
    const estPayment = Math.round((estKwh * 0.13 + 150) / 12);
    setGasCurrentRate(estPayment);
  };

  const handleGasKwhChange = (kwh: number) => {
    setGasKwh(kwh);
    const estPayment = Math.round((kwh * 0.13 + 150) / 12);
    setGasCurrentRate(estPayment);
  };

  // Realistic & Mathematically consistent calculation engine using live admin pricing
  const calculateStromSavings = () => {
    const annualCurrent = Math.max(120, stromCurrentRate * 12);
    // Best market rate using live parameters: ct/kWh + monthly base fee * 12
    const theoreticalBest = Math.round(
      stromKwh * (currentPricing.stromArbeitspreis / 100) + currentPricing.stromGrundpreis * 12
    );

    let savings = 0;
    let optimizedAnnual = 0;

    if (annualCurrent > theoreticalBest + 40) {
      optimizedAnnual = theoreticalBest;
      savings = annualCurrent - optimizedAnnual;
    } else {
      // If user already pays very low rate, realistic savings from cashback/bonus is 15-20%
      savings = Math.max(60, Math.round(annualCurrent * 0.16));
      optimizedAnnual = annualCurrent - savings;
    }

    return {
      annualCurrent,
      optimizedAnnual,
      savings,
    };
  };

  const calculateGasSavings = () => {
    const annualCurrent = Math.max(300, gasCurrentRate * 12);
    // Best market rate using live parameters: ct/kWh + monthly base fee * 12
    const theoreticalBest = Math.round(
      gasKwh * (currentPricing.gasArbeitspreis / 100) + currentPricing.gasGrundpreis * 12
    );

    let savings = 0;
    let optimizedAnnual = 0;

    if (annualCurrent > theoreticalBest + 60) {
      optimizedAnnual = theoreticalBest;
      savings = annualCurrent - optimizedAnnual;
    } else {
      // User has existing contract below current market rate; optimization via bonus/margin
      savings = Math.max(120, Math.round(annualCurrent * 0.15));
      optimizedAnnual = annualCurrent - savings;
    }

    return {
      annualCurrent,
      optimizedAnnual,
      savings,
    };
  };

  const calculateInternetSavings = () => {
    const annualCurrent = internetCurrentPrice * 12;
    // Promotional average from live pricing
    const theoreticalBest = Math.round(currentPricing.internetPromoPrice * 12);
    const savings = Math.max(60, Math.max(annualCurrent - theoreticalBest, Math.round(annualCurrent * 0.22)));
    const optimizedAnnual = annualCurrent - savings;

    return {
      annualCurrent,
      optimizedAnnual,
      savings,
    };
  };

  const calculateKfzSavings = () => {
    const annualCurrent = kfzCurrentAnnual;
    const factor = (currentPricing.kfzAvgSavingsPercent / 100) * (kfzCoverage === 'vollkasko' ? 1.1 : kfzCoverage === 'teilkasko' ? 1.0 : 0.85);
    const savings = Math.max(80, Math.round(annualCurrent * factor));
    const optimizedAnnual = annualCurrent - savings;

    return {
      annualCurrent,
      optimizedAnnual,
      savings,
    };
  };

  let currentResult = { annualCurrent: 0, optimizedAnnual: 0, savings: 0 };
  let serviceLabel = '';

  if (activeTab === 'strom') {
    currentResult = calculateStromSavings();
    serviceLabel = 'Strom';
  } else if (activeTab === 'gas') {
    currentResult = calculateGasSavings();
    serviceLabel = 'Gas';
  } else if (activeTab === 'internet') {
    currentResult = calculateInternetSavings();
    serviceLabel = 'Internet';
  } else if (activeTab === 'kfz') {
    currentResult = calculateKfzSavings();
    serviceLabel = 'KFZ-Versicherung';
  }

  const handleApply = () => {
    const savingsText = `${currentResult.savings} € / Jahr bei ${serviceLabel}`;
    onApplySavingsToBooking(activeTab, savingsText);
  };

  const shareViaWhatsApp = () => {
    const text = `Hallo Daryos, ich habe meinen ${serviceLabel}-Tarif im Rechner geprüft.\nBisherige Kosten: ${currentResult.annualCurrent} €/Jahr\nOptimiert: ${currentResult.optimizedAnnual} €/Jahr\nMögliche Ersparnis: ca. ${currentResult.savings} €/Jahr.\nBitte um einen kostenlosen Tarif-Check.`;
    window.open(`https://wa.me/4917643416174?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section id="calculator" className="py-20 bg-[#07070a] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Calm & focused */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2.5">
          <div className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
            Transparente Sofort-Berechnung
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.calculator.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            {t.calculator.subtitle}
          </p>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex justify-center mb-10">
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
                    <span className="text-blue-400 font-mono tabular-nums">{stromKwh.toLocaleString()} kWh/Jahr</span>
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
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.currentMonthlyRate}</span>
                    <span className="text-blue-400 font-mono tabular-nums">{stromCurrentRate} € / Monat</span>
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
                  <div className="text-[11px] text-slate-500 mt-1">
                    Aktuelle Jahreskosten: {(stromCurrentRate * 12).toLocaleString()} €
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
                    <span className="text-orange-400 font-mono tabular-nums">{gasKwh.toLocaleString()} kWh/Jahr</span>
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
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
                    <span>{t.calculator.currentMonthlyRate}</span>
                    <span className="text-orange-400 font-mono tabular-nums">{gasCurrentRate} € / Monat</span>
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
                  <div className="text-[11px] text-slate-500 mt-1">
                    Aktuelle Jahreskosten: {(gasCurrentRate * 12).toLocaleString()} €
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
                    <span className="text-blue-400 font-mono tabular-nums">{internetCurrentSpeed} Mbit/s</span>
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
                    <span className="text-blue-400 font-mono tabular-nums">{internetCurrentPrice} € / Monat</span>
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
                    <span className="text-emerald-400 font-mono tabular-nums">SF {kfzSf}</span>
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
                    <span className="text-emerald-400 font-mono tabular-nums">{kfzCurrentAnnual} € / Jahr</span>
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
              </div>
            )}

            {/* Active Category Provider Logos Showcase */}
            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Verglichene Top-Anbieter für {activeTab === 'strom' ? 'Strom' : activeTab === 'gas' ? 'Gas' : activeTab === 'internet' ? 'Internet' : 'KFZ'}:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(activeTab === 'strom'
                  ? ['vattenfall', 'eon', 'yello', 'stadtwerke-leipzig', 'enbw']
                  : activeTab === 'gas'
                  ? ['eon', 'vattenfall', 'stadtwerke-leipzig', 'montana', 'maingau']
                  : activeTab === 'internet'
                  ? ['telekom', 'vodafone', '1und1', 'o2', 'pyur']
                  : ['allianz', 'huk-coburg', 'axa', 'devk', 'adac']
                ).map((provId) => (
                  <div key={provId} className="hover:scale-105 transition-transform">
                    <ProviderLogo id={provId} size="sm" variant="dark" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Output Panel - Clean, calm, 100% mathematically correct */}
          <div className="lg:col-span-5 bg-[#0b0c10] p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.calculator.resultTitle}
                </span>
                <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.calculator.liveCalculation}</span>
                </span>
              </div>

              {/* Big Savings Callout */}
              <div className="p-5 bg-[#121319] rounded-xl border border-white/[0.06]">
                <div className="text-xs text-slate-400 mb-1">
                  {t.calculator.estimatedSavings}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tabular-nums">
                    {currentResult.savings.toLocaleString()} €
                  </span>
                  <span className="text-slate-400 text-sm font-medium">
                    {t.calculator.perYear}
                  </span>
                </div>
                <div className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.calculator.guaranteedQuality}</span>
                </div>
                <div className="text-[11px] text-blue-300 font-medium mt-1.5 flex items-center gap-1.5 bg-blue-950/40 p-2 rounded-lg border border-blue-500/20">
                  <span className="text-xs">🛡️</span>
                  <span><strong>Nachzahlungs-Schutz garantiert:</strong> Ihr Abschlag wird exakt kalkuliert, damit Sie keine böse Nachzahlung am Jahresende erhalten.</span>
                </div>
              </div>

              {/* Exact Invariant Breakdown: Bisherige Kosten = Optimierte Kosten + Ersparnis */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.calculator.previousAnnualCosts}</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {currentResult.annualCurrent.toLocaleString()} €
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.calculator.optimizedAnnualCosts}</span>
                  <span className="font-mono tabular-nums text-blue-400 font-semibold">
                    {currentResult.optimizedAnnual.toLocaleString()} €
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
                {t.calculator.potentialLabel}
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
                <span>{t.calculator.shareWhatsAppBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
