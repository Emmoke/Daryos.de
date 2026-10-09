import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ReviewsSectionProps {
  currentLang: Language;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang];

  return (
    <section id="reviews" className="py-20 bg-[#050508] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
        <div className="text-xs font-semibold text-orange-400 tracking-wider uppercase">
          {t.reviews.sectionSub}
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t.reviews.sectionTitle}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Echte Kundenstimmen veröffentlichen wir nur mit Zustimmung der betreffenden Personen. Aktuell werden auf dieser Website keine verifizierten Bewertungen angezeigt.
        </p>
      </div>
    </section>
  );
};
