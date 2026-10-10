import React from 'react';
import { Language, AuthUser } from '../types';
import { translations } from '../data/translations';
import { Logo } from './Logo';

interface FooterProps {
  currentLang: Language;
  onOpenLegal: (type: 'impressum' | 'datenschutz') => void;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, onOpenLegal }) => {
  const t = translations[currentLang];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#050508] text-slate-400 py-12 border-t border-white/[0.08] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <Logo size="sm" showSubtitle={true} />
            <p className="text-slate-500 text-xs max-w-md pt-1">
              {t.footer.tagline}
            </p>
          </div>

          {/* Nav links mirror */}
          <div className="flex flex-wrap gap-5 text-slate-400 text-xs font-medium">
            <a href="#services" className="hover:text-white transition-colors">{t.nav.services}</a>
            <a href="#calculator" className="hover:text-white transition-colors">{t.nav.calculator}</a>
            <a href="#process" className="hover:text-white transition-colors">{t.nav.process}</a>
            <a href="#transparency" className="hover:text-white transition-colors">Transparenz</a>
            <a href="#audit" className="hover:text-white transition-colors">{t.nav.audit}</a>
            <a href="#reviews" className="hover:text-white transition-colors">{t.nav.reviews}</a>
            <a href="#contact" className="hover:text-white transition-colors">{t.nav.contact}</a>
          </div>
        </div>

        {/* Bottom copyright and legal notices */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <div>
            © {year} Daryos®. {t.footer.rights}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenLegal('impressum')}
              className="hover:text-slate-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              {t.footer.impressum}
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegal('datenschutz')}
              className="hover:text-slate-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              {t.footer.privacy}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

