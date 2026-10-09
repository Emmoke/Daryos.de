import React, { useState } from 'react';
import { ArrowRight, Check, X, FileText, Building2, Shield, CalendarCheck } from 'lucide-react';
import { Language, ServiceType, ServiceDetail } from '../types';
import { translations } from '../data/translations';
import { servicesData } from '../data/servicesData';
import { ProviderLogo } from './ProviderLogos';

interface ServicesSectionProps {
  currentLang: Language;
  onSelectServiceBooking: (service: ServiceType) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ currentLang, onSelectServiceBooking }) => {
  const t = translations[currentLang];
  const [activeModalService, setActiveModalService] = useState<ServiceDetail | null>(null);

  return (
    <section id="services" className="py-20 bg-[#050508] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-semibold text-orange-400/90 tracking-wider uppercase">
            {t.services.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.services.sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            {t.services.sectionDesc}
          </p>
        </div>

        {/* 4 Bento Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          {servicesData.map((service) => (
            <div
              key={service.id}
              className="bg-[#0b0c10] rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg flex flex-col justify-between hover:border-white/[0.16] transition-all group"
            >
              <div>
                {/* Image Container with Fallback */}
                <div className="relative h-48 overflow-hidden bg-[#07070a]">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent opacity-80" />

                  {/* Clean unboxed category kicker on image overlay */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-slate-200 text-xs font-semibold px-3 py-1 rounded-md border border-white/10">
                    {service.badge}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {service.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {service.tagline}
                  </p>

                  <div className="text-xs font-semibold text-emerald-400 pt-1">
                    {service.savingsHint}
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                    {service.bulletPoints.slice(0, 3).map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Provider Logos Mini Bar on Card */}
                  <div className="pt-2 border-t border-white/[0.04]">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Anbieterbeispiele (keine Aussage zu Partnerschaft oder Verfügbarkeit):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {service.providersExample.slice(0, 3).map((prov, pIdx) => (
                        <div key={pIdx} className="scale-90 origin-left">
                          <ProviderLogo id={prov} size="sm" variant="dark" />
                        </div>
                      ))}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 font-mono">
                        +{service.providersExample.length - 3} weitere
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => setActiveModalService(service)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-[#14151c] hover:bg-[#1a1b24] rounded-lg transition-colors border border-white/[0.08] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.services.detailsBtn}</span>
                </button>

                <button
                  onClick={() => onSelectServiceBooking(service.id)}
                  className="w-full py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>{t.services.bookBtn}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setActiveModalService(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="text-2xl">{activeModalService.badge.split(' ')[0]}</span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {activeModalService.title}
                </h3>
                <p className="text-xs text-blue-400 font-medium">
                  {activeModalService.savingsHint}
                </p>
              </div>
            </div>

            {/* Detailed Description */}
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeModalService.description}
            </p>

            {/* Checklist of required documents */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>{t.services.modalDocsTitle}</span>
              </div>
              <ul className="space-y-2">
                {activeModalService.requiredDocs.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Providers compared */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Anbieterbeispiele – Verfügbarkeit bitte individuell prüfen</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {activeModalService.providersExample.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center hover:border-slate-700 transition-colors"
                  >
                    <ProviderLogo id={p} size="sm" variant="dark" />
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const sId = activeModalService.id;
                  setActiveModalService(null);
                  onSelectServiceBooking(sId);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors text-center cursor-pointer"
              >
                Jetzt Termin für {activeModalService.title} vereinbaren
              </button>
              <button
                onClick={() => setActiveModalService(null)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer"
              >
                {t.services.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
