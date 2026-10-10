import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CalculatorComponent } from './components/Calculator';
import { ServicesSection } from './components/ServicesSection';
import { ProcessSection } from './components/ProcessSection';
import { TransparencySection } from './components/TransparencySection';
import { ContractUploadSection } from './components/ContractUploadSection';
import { BookingSection } from './components/BookingSection';
import { ReviewsSection } from './components/ReviewsSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { LegalModals } from './components/LegalModals';
import { AdminCockpit, TariffPricingConfig } from './components/AdminCockpit';
import { PartnerLogosBanner } from './components/ProviderLogos';
import { Language, ServiceType, AuthUser } from './types';
import { api } from './platform/api';
import { VergleichPage } from './platform/VergleichPage';
import { StatusPage } from './platform/StatusPage';
import { AdminDashboard, AdminLogin } from './platform/AdminDashboard';
import { ChatWidget } from './platform/ChatWidget';

const defaultPricing: TariffPricingConfig = {
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

// Abschnitte der Startseite. Ausgeblendete Bereiche bleiben im Code erhalten und lassen sich hier wieder einschalten.
export const SECTIONS = {
  providers: true,
  calculator: false, // Spar-Rechner: arbeitet mit Richtwerten, doppelt sich mit dem Tarifvergleich
  contractUpload: false, // Rechnungs-Check: öffnet nur WhatsApp/E-Mail
  reviews: false, // Kundenstimmen: noch keine echten Bewertungen vorhanden
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [bookingService, setBookingService] = useState<ServiceType | 'all'>('all');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);
  const [adminCockpitOpen, setAdminCockpitOpen] = useState<boolean>(false);

  // Angemeldeter Administrator – die Sitzung liegt als HttpOnly-Cookie beim Server, nicht im localStorage
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [route, setRoute] = useState<string>(() => window.location.hash);

  useEffect(() => {
    api.admin.me().then((r) => setAuthUser(r.user)).catch(() => setAuthUser(null));
    try {
      // Alte, unsichere Browser-Sitzungen der früheren PIN-Anmeldung entfernen
      ['daryos_admin_session', 'daryos_auth_role', 'daryos_auth_email', 'daryos_auth_name', 'daryos_admin_pin'].forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      setRoute(hash);
      if (hash.startsWith('#/')) {
        window.scrollTo({ top: 0 });
      } else if (hash.length > 1) {
        // Anker der Startseite erst nach dem Rendern ansteuern
        setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
  };

  const handleLogout = () => {
    api.admin.logout().catch(() => {});
    setAuthUser(null);
    setAdminCockpitOpen(false);
  };
  const [pricingConfig, setPricingConfig] = useState<TariffPricingConfig>(() => {
    try {
      const saved = localStorage.getItem('daryos_pricing_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return defaultPricing;
  });

  const handleUpdatePricing = (newConfig: TariffPricingConfig) => {
    setPricingConfig(newConfig);
    try {
      localStorage.setItem('daryos_pricing_config', JSON.stringify(newConfig));
    } catch (e) {
      // ignore
    }
  };

  // Sync RTL and lang attribute
  useEffect(() => {
    document.documentElement.lang = currentLang;
    if (currentLang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLang]);

  const scrollToBooking = () => {
    const el = document.getElementById('booking');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#booking'; // von einer Plattform-Seite zurück zur Startseite
    }
  };

  const scrollToCalc = () => {
    const el = document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplySavingsToBooking = (service: ServiceType, savingsText: string) => {
    setBookingService(service);
    setBookingNotes(`Im Schnell-Rechner ermitteltes Sparpotenzial: ${savingsText}. Bitte um detaillierte Überprüfung.`);
    scrollToBooking();
  };

  const handleSelectServiceBooking = (service: ServiceType) => {
    setBookingService(service);
    scrollToBooking();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenBooking={scrollToBooking}
        onOpenAdmin={() => setAdminCockpitOpen(true)}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Content: Plattform-Seiten über #/…, sonst die Startseite */}
      <main className="flex-1">
        {route.startsWith('#/vergleich') ? (
          <VergleichPage onOpenPrivacy={() => setLegalModal('datenschutz')} />
        ) : route.startsWith('#/status') ? (
          <StatusPage initialId={route.split('/')[2] || undefined} />
        ) : route.startsWith('#/admin') ? (
          authUser ? (
            <AdminDashboard user={authUser as any} onLogout={handleLogout} onOpenCockpit={() => setAdminCockpitOpen(true)} />
          ) : (
            <AdminLogin onLogin={handleLoginSuccess} />
          )
        ) : (
          <>
        {/* 1. Hero mit einem klaren Hauptweg: Tarif vergleichen */}
        <Hero
          currentLang={currentLang}
          onOpenBooking={scrollToBooking}
          onScrollToCalc={SECTIONS.calculator ? scrollToCalc : undefined}
        />

        {/* 2. So funktioniert's */}
        <ProcessSection currentLang={currentLang} />

        {/* 3. Leistungen: Strom & Gas im Mittelpunkt, Internet kompakt */}
        <ServicesSection
          currentLang={currentLang}
          onSelectServiceBooking={handleSelectServiceBooking}
        />

        {SECTIONS.providers && <PartnerLogosBanner />}

        {SECTIONS.calculator && (
          <CalculatorComponent
            currentLang={currentLang}
            onApplySavingsToBooking={handleApplySavingsToBooking}
            pricingConfig={pricingConfig}
          />
        )}

        {/* 4. Vertrauen: Transparenz & FAQ */}
        <TransparencySection currentLang={currentLang} onOpenBooking={scrollToBooking} />
        <FaqSection currentLang={currentLang} />

        {SECTIONS.contractUpload && (
          <ContractUploadSection
            currentLang={currentLang}
            onOpenBooking={scrollToBooking}
          />
        )}

        {/* 5. Termin & Kontakt */}
        <BookingSection
          currentLang={currentLang}
          preselectedService={bookingService}
          initialNotes={bookingNotes}
        />

        {SECTIONS.reviews && (
          <ReviewsSection
            currentLang={currentLang}
            onOpenPrivacy={() => setLegalModal('datenschutz')}
          />
        )}

        <ContactSection currentLang={currentLang} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        currentLang={currentLang}
        onOpenLegal={setLegalModal}
        onOpenAdmin={() => setAdminCockpitOpen(true)}
        authUser={authUser}
      />

      {/* Legal Modals (Impressum & Datenschutz) */}
      <LegalModals
        activeModal={legalModal}
        onClose={() => setLegalModal(null)}
        currentLang={currentLang}
      />

      {/* Berater- & Tablet-Cockpit (Admin & Controlling) - NUR für Eigentümer & Admin */}
      <AdminCockpit
        isOpen={adminCockpitOpen}
        onClose={() => setAdminCockpitOpen(false)}
        pricingConfig={pricingConfig}
        onUpdatePricing={handleUpdatePricing}
        authUser={authUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Chat-Assistent mit WhatsApp- und Termin-Schnellzugriff */}
      {!route.startsWith('#/admin') && <ChatWidget onOpenBooking={scrollToBooking} />}
    </div>
  );
}
