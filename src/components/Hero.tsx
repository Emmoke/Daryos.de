import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Bot, CalendarCheck, FileSearch, MessageSquare, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import heroImage from '../assets/images/hero_advisor_office_1791468907588.jpg';

interface HeroProps {
  currentLang: Language;
  onOpenBooking: () => void;
  onScrollToCalc: () => void;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const STEPS = [
  { icon: FileSearch, title: 'Angaben eingeben', text: 'PLZ und Verbrauch – ohne Kontaktdaten.' },
  { icon: Bot, title: 'Angebote vergleichen', text: 'Kosten, Laufzeit und Preisgarantie transparent.' },
  { icon: UserCheck, title: 'Daryos prüft', text: 'Ein Mensch prüft und begleitet den Wechsel.' },
];

export const Hero: React.FC<HeroProps> = ({ currentLang, onOpenBooking, onScrollToCalc }) => {
  const t = translations[currentLang];

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#05060a]">
      {/* Hintergrund: Aurora, Raster und dezentes Foto */}
      <div className="absolute inset-0 -z-0" aria-hidden>
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity" />
        <div className="aurora-blob w-[520px] h-[520px] -top-40 -left-32 bg-blue-600" />
        <div className="aurora-blob w-[460px] h-[460px] top-10 right-[-120px] bg-indigo-600" style={{ animationDelay: '-6s' }} />
        <div className="aurora-blob w-[380px] h-[380px] bottom-[-160px] left-1/3 bg-orange-500/70" style={{ animationDelay: '-12s' }} />
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05060a]/40 to-[#05060a]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            <motion.a
              {...fadeUp(0)}
              href="#/vergleich"
              className="shimmer-border inline-flex items-center gap-2 rounded-full border border-transparent p-px"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0b0c12] px-3.5 py-1.5 text-xs font-medium text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" aria-hidden />
                Neu: Online-Tarifvergleich für Gas & Strom
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden />
              </span>
            </motion.a>

            <motion.h1 {...fadeUp(0.08)} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] text-balance">
              {t.hero.titleStart} <span className="text-gradient">{t.hero.titleStrom}, {t.hero.titleGas}</span>, {t.hero.titleInternet} &{' '}
              {t.hero.titleKfz} {t.hero.titleEnd}
            </motion.h1>

            <motion.p {...fadeUp(0.16)} className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl">
              {t.hero.subtitle}
            </motion.p>

            <motion.div {...fadeUp(0.24)} className="flex flex-wrap items-center gap-3">
              <a
                href="#/vergleich"
                className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-500/50"
              >
                Tarife online vergleichen
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur transition hover:bg-white/[0.08]"
              >
                <CalendarCheck className="w-4 h-4 text-blue-300" aria-hidden />
                {t.hero.btnBook}
              </button>
              <a
                href="https://wa.me/4917643416174?text=Hallo%20Daryos%2C%20ich%20interessiere%20mich%20f%C3%BCr%20einen%20Tarifvergleich."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" aria-hidden />
                {t.hero.btnWhatsApp}
              </a>
            </motion.div>

            <motion.ul {...fadeUp(0.32)} className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-emerald-400" aria-hidden /> {t.hero.stat2Label}</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" aria-hidden /> Keine Vertragszusage ohne Ihre Zustimmung</li>
              <li className="flex items-center gap-1.5"><button onClick={onScrollToCalc} className="underline-offset-4 hover:underline hover:text-slate-200">{t.hero.btnCalc}</button></li>
            </motion.ul>
          </div>

          {/* Glas-Karte: So funktioniert es */}
          <motion.div {...fadeUp(0.2)} className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-500/20 via-transparent to-orange-500/20 -z-10 blur-xl" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/90">Leipzig & bundesweit</p>
              <p className="mt-1 text-xl font-bold text-white">In drei Schritten zum passenden Tarif</p>
              <ol className="mt-6 space-y-5">
                {STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-4">
                    <span className="relative grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/25 to-indigo-500/10 border border-white/10">
                      <Icon className="w-5 h-5 text-blue-300" aria-hidden />
                      {i < STEPS.length - 1 && <span className="absolute top-11 left-1/2 h-5 w-px bg-white/10" aria-hidden />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <a href="#/vergleich" className="rounded-xl bg-white text-slate-900 py-2.5 text-center text-xs font-bold hover:bg-slate-200 transition">Jetzt starten</a>
                <button onClick={onOpenBooking} className="rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] transition">Beratung buchen</button>
              </div>
              <p className="mt-4 text-[11px] text-slate-500">Persönliche Beratung auf Deutsch, Türkisch, Kurdisch & Arabisch · Rotfuchsstraße 1, 04329 Leipzig</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
