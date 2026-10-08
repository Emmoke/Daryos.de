import React from 'react';
import { ArrowRight, MessageSquare, Calculator, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface HeroProps {
  currentLang: Language;
  onOpenBooking: () => void;
  onScrollToCalc: () => void;
}

export const Hero: React.FC<HeroProps> = ({ currentLang, onOpenBooking, onScrollToCalc }) => {
  const t = translations[currentLang];

  return (
    <section className="relative min-h-[640px] flex items-center overflow-hidden border-b border-slate-800 bg-slate-950">
      {/* Background Photography with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_advisor_office_1791468907588.jpg"
          alt="Daryos Tarifberatung Leipzig"
          className="w-full h-full object-cover object-center opacity-35"
          referrerPolicy="no-referrer"
        />
        {/* Measured dark gradient scrim for 4.5:1 WCAG AA contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-8 space-y-7">
            {/* Unboxed natural kicker / trust marker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Display Headline with Balanced Wrapping - Calm & elegant typography */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
              {t.hero.titleStart}{' '}
              <span className="text-blue-400 font-bold">{t.hero.titleStrom}</span>,{' '}
              <span className="text-slate-200">{t.hero.titleGas}</span>,{' '}
              <span className="text-slate-200">{t.hero.titleInternet}</span> &{' '}
              <span className="text-slate-200">{t.hero.titleKfz}</span>{' '}
              {t.hero.titleEnd}
            </h1>

            {/* Value Proposition */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {t.hero.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onScrollToCalc}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer border border-blue-500/30 shadow-sm"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>{t.hero.btnCalc}</span>
              </button>

              <button
                onClick={onOpenBooking}
                className="px-6 py-3.5 bg-[#121319] hover:bg-[#181921] text-slate-200 border border-white/[0.1] font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{t.hero.btnBook}</span>
                <ArrowRight className="w-4 h-4 shrink-0 text-slate-400" />
              </button>

              <a
                href="https://wa.me/4917643416174?text=Hallo%20Daryos%2C%20ich%20interessiere%20mich%20f%C3%BCr%20einen%20Tarifvergleich."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-[#14151c] hover:bg-[#1a1b24] text-slate-200 border border-white/[0.08] font-medium rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.hero.btnWhatsApp}</span>
              </a>
            </div>

            {/* Claim-to-Proof Metric Strips */}
            <div className="pt-8 border-t border-white/[0.08] grid grid-cols-3 gap-6 max-w-xl">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                  {t.hero.stat1Number}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                  {t.hero.stat1Label}
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono tabular-nums">
                  {t.hero.stat2Number}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                  {t.hero.stat2Label}
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono tabular-nums">
                  {t.hero.stat3Number}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                  {t.hero.stat3Label}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Highlight Card on the right */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-[#0b0c10]/95 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
              <div className="border-b border-white/[0.06] pb-4">
                <div className="text-xs font-semibold text-orange-400/90 uppercase tracking-wider mb-1">
                  Leipzig & Mitteldeutschland
                </div>
                <div className="text-lg font-bold text-white">
                  Ihr persönlicher Wechselservice
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Kein mühsamer Papierkram oder Hotline-Warteschleifen</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Schutz vor auslaufenden Preisgarantien und Preissprüngen</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Persönliche Beratung auf Deutsch, Türkisch, Kurdisch & Arabisch</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Büro vor Ort in der Rotfuchsstraße 1, 04329 Leipzig</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenBooking}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all text-center cursor-pointer border border-blue-500/30"
                >
                  Unverbindliche Beratung buchen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
