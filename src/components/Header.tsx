import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Globe, Menu, X, CalendarCheck, ShieldCheck, Tablet, Lock, Crown, LogOut } from 'lucide-react';
import { Language, AuthUser } from '../types';
import { translations } from '../data/translations';
import { Logo } from './Logo';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenBooking: () => void;
  onOpenAdmin: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenBooking,
  onOpenAdmin,
  authUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const t = translations[currentLang];

  useEffect(() => {
    // Leipzig local time (Europe/Berlin)
    const checkOpenStatus = () => {
      const now = new Date();
      const deTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' });
      const deDate = new Date(deTimeStr);
      const day = deDate.getDay();
      const hours = deDate.getHours();
      const minutes = deDate.getMinutes();
      const currentMinute = hours * 60 + minutes;

      if (day >= 1 && day <= 5) {
        setIsOpenNow(currentMinute >= 9 * 60 && currentMinute < 18 * 60);
      } else if (day === 6) {
        setIsOpenNow(currentMinute >= 10 * 60 && currentMinute < 14 * 60);
      } else {
        setIsOpenNow(false);
      }
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const languageLabels: Record<Language, { label: string; flag: string }> = {
    de: { label: 'Deutsch', flag: '🇩🇪' },
    en: { label: 'English', flag: '🇬🇧' },
    tr: { label: 'Türkçe', flag: '🇹🇷' },
    ku: { label: 'Kurdî', flag: '☀️' },
    ar: { label: 'العربية', flag: '🇸🇦' },
  };

  return (
    <header className="sticky top-0 z-50 bg-[#08080b]/95 backdrop-blur-md border-b border-white/[0.08]">
      {/* Top Info Banner - Calm & balanced */}
      <div className="bg-[#0c0d12] text-slate-400 text-xs py-2 px-4 sm:px-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-orange-400/90 shrink-0" />
              <span>{t.topbar.address}</span>
            </span>
            <a
              href="tel:+4917643416174"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-medium">+49 176 43416174</span>
            </a>
            <a
              href="mailto:daryos.kreis@gmail.com"
              className="hidden lg:flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t.topbar.email}</span>
            </a>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Live Open Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#12131a] border border-white/[0.08] text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={isOpenNow ? 'text-emerald-300' : 'text-slate-400'}>
                {isOpenNow ? t.topbar.openNow : t.topbar.closedNow}
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#12131a] px-2.5 py-1 rounded-lg border border-white/[0.08] text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                aria-label="Sprache wählen"
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium py-0.5 text-xs"
              >
                {(Object.keys(languageLabels) as Language[]).map((lang) => (
                  <option key={lang} value={lang} className="bg-[#12131a] text-white">
                    {languageLabels[lang].flag} {languageLabels[lang].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - Strictly conforms to Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-22 flex items-center justify-between">
        {/* Zone 1: Authentic Daryos Logo matching image.png */}
        <a href="#" className="flex items-center cursor-pointer focus:outline-none">
          <Logo size="md" showSubtitle={true} />
        </a>

        {/* Zone 2: 4-6 Clean Text Navigation Links with Calm Hover */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-300">
          <a href="#/vergleich" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors py-1">
            Tarifvergleich
          </a>
          <a href="#services" className="hover:text-blue-400 transition-colors py-1">
            {t.nav.services}
          </a>
          <a href="#process" className="hover:text-blue-400 transition-colors py-1">
            {t.nav.process}
          </a>
          <a href="#faq" className="hover:text-blue-400 transition-colors py-1">
            {t.nav.faq}
          </a>
          <a href="#contact" className="hover:text-blue-400 transition-colors py-1">
            {t.nav.contact}
          </a>
        </nav>

        {/* Zone 3: Primary Action - Calm and distinguished */}
        <div className="flex items-center gap-2.5">
          {/* KI-Cockpit & Automatisierung - NUR für authentifizierte Eigentümer & Admins sichtbar */}
          {authUser ? (
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={onOpenAdmin}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border shadow-xs transition-all cursor-pointer ${
                  authUser.role === 'eigentuemer'
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/50'
                    : 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border-blue-500/50'
                }`}
                title={`Angemeldet als ${authUser.name} (${authUser.email})`}
              >
                {authUser.role === 'eigentuemer' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="hidden 2xl:inline">
                  {authUser.role === 'eigentuemer' ? 'Eigentümer-Cockpit' : 'Admin-Cockpit'}
                </span>
                <span className="hidden 2xl:inline text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-300 font-mono">
                  {authUser.role === 'eigentuemer' ? 'Inhaber' : 'Admin'}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                title="Cockpit sperren & abmelden"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Diskreter Zugang für Eigentümer / Admin, fällt Besuchern nicht störend auf */
            <button
              onClick={onOpenAdmin}
              className="hidden md:flex items-center justify-center p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              title="Eigentümer- & Admin-Zugang (Geschützt)"
              aria-label="Eigentümer & Admin Zugang"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenBooking}
            className="px-3 sm:px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap border border-blue-500/40 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t.nav.bookAppointment}</span>
            <span className="sr-only sm:hidden">{t.nav.bookAppointment}</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-white/[0.08] hover:bg-slate-900"
            aria-label="Menü öffnen"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0a0b0e] border-b border-white/[0.08] px-6 py-5 space-y-4">
          <nav className="flex flex-col space-y-3 text-base font-medium text-slate-300">
            <a href="#/vergleich" onClick={() => setMobileMenuOpen(false)} className="text-orange-400 font-semibold py-1">
              Tarifvergleich
            </a>
            <a href="#/status" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400 py-1">
              Anfragestatus
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-blue-400 py-1"
            >
              {t.nav.services}
            </a>
            <a
              href="#transparency"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-blue-400 py-1"
            >
              Transparenz
            </a>
            <a
              href="#process"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-blue-400 py-1"
            >
              {t.nav.process}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-blue-400 py-1"
            >
              {t.nav.faq}
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-blue-400 py-1"
            >
              {t.nav.contact}
            </a>
          </nav>
          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
            {authUser ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className={`w-full py-2.5 font-bold rounded-lg text-xs text-center flex items-center justify-center gap-2 border ${
                    authUser.role === 'eigentuemer'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {authUser.role === 'eigentuemer' ? (
                    <Crown className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Tablet className="w-4 h-4 text-blue-400" />
                  )}
                  <span>
                    {authUser.role === 'eigentuemer'
                      ? 'Eigentümer-Cockpit (Emmoke)'
                      : 'Admin-Cockpit'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 bg-slate-900 text-slate-400 hover:text-rose-300 text-xs text-center flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cockpit sperren & abmelden</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs text-center flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3 h-3" />
                <span>Eigentümer- & Admin-Zugang</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg text-sm text-center"
            >
              {t.nav.bookAppointment}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

