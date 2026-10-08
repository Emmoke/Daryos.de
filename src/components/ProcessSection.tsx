import React from 'react';
import { Search, Scale, ArrowRightLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ProcessSectionProps {
  currentLang: Language;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  const steps = [
    {
      num: '01',
      title: t.process.step1Title,
      desc: t.process.step1Desc,
      icon: Search,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      num: '02',
      title: t.process.step2Title,
      desc: t.process.step2Desc,
      icon: Scale,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      num: '03',
      title: t.process.step3Title,
      desc: t.process.step3Desc,
      icon: ArrowRightLeft,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      num: '04',
      title: t.process.step4Title,
      desc: t.process.step4Desc,
      icon: ShieldCheck,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <section id="process" className="py-20 bg-slate-900 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            {t.process.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.process.sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            {t.process.sectionDesc}
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-slate-600">
                      {s.num}
                    </span>
                    <div className={`p-2.5 rounded-xl border ${s.bgColor}`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                    {s.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Schritt {index + 1} von 4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-950 border border-slate-800/80 max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <span className="font-bold text-white">Gesetzliche Versorgungsgarantie: </span>
            In Deutschland ist eine Unterbrechung von Strom oder Gas beim Anbieterwechsel gesetzlich ausgeschlossen (§ 36 EnWG). Sie behalten durchgehend Licht und Wärme – zu deutlich besseren Konditionen.
          </div>
        </div>
      </div>
    </section>
  );
};
