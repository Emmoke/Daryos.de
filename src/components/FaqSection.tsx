import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { faqData } from '../data/servicesData';

interface FaqSectionProps {
  currentLang: Language;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const [openId, setOpenId] = useState<string | null>('f1');

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-slate-900 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
            {t.faq.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.faq.sectionTitle}
          </h2>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {faqData.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-900">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
