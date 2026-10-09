import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CalculatorComponent } from './components/Calculator';
import { ServicesSection } from './components/ServicesSection';
import { ProcessSection } from './components/ProcessSection';
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
import { MessageSquare, Phone } from 'lucide-react';

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

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [bookingService, setBookingService] = useState<ServiceType | 'all'>('all');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);
  const [adminCockpitOpen, setAdminCockpitOpen] = useState<boolean>(false);

  // Authentifizierter Nutzer (NUR Eigentümer und Administratoren)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const session = localStorage.getItem('daryos_admin_session') === 'true';
      if (!session) return null;
      const role = (localStorage.getItem('daryos_auth_role') as 'eigentuemer' | 'admin') || 'eigentuemer';
      const email = localStorage.getItem('daryos_auth_email') || 'Emmoke@outlook.de';
      const name = localStorage.getItem('daryos_auth_name') || (role === 'eigentuemer' ? 'Daryos Inhaber' : 'Administrator');
      return { role, email, name };
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user: AuthUser) => {
    try {
      localStorage.setItem('daryos_admin_session', 'true');
      localStorage.setItem('daryos_auth_role', user.role);
      localStorage.setItem('daryos_auth_email', user.email);
      localStorage.setItem('daryos_auth_name', user.name);
    } catch (e) {
      // ignore
    }
    setAuthUser(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('daryos_admin_session');
      localStorage.removeItem('daryos_auth_role');
      localStorage.removeItem('daryos_auth_email');
      localStorage.removeItem('daryos_auth_name');
    } catch (e) {
      // ignore
    }
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

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero */}
        <Hero
          currentLang={currentLang}
          onOpenBooking={scrollToBooking}
          onScrollToCalc={scrollToCalc}
        />

        {/* 1.5 Partner & Versorger Logos Wall */}
        <PartnerLogosBanner />

        {/* 2. Services Grid */}
        <ServicesSection
          currentLang={currentLang}
          onSelectServiceBooking={handleSelectServiceBooking}
        />

        {/* 3. Interactive Instant Calculator */}
        <CalculatorComponent
          currentLang={currentLang}
          onApplySavingsToBooking={handleApplySavingsToBooking}
          pricingConfig={pricingConfig}
        />

        {/* 4. Switching Journey Process */}
        <ProcessSection currentLang={currentLang} />

        {/* 5. Bill & Contract Audit Simulation */}
        <ContractUploadSection
          currentLang={currentLang}
          onOpenBooking={scrollToBooking}
        />

        {/* 6. Online Booking Assistant */}
        <BookingSection
          currentLang={currentLang}
          preselectedService={bookingService}
          initialNotes={bookingNotes}
        />

        {/* 7. Reviews & Social Proof */}
        <ReviewsSection
          currentLang={currentLang}
          onOpenPrivacy={() => setLegalModal('datenschutz')}
        />

        {/* 8. FAQ */}
        <FaqSection currentLang={currentLang} />

        {/* 9. Contact, Hours & Map */}
        <ContactSection currentLang={currentLang} />
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

      {/* Floating Quick Action Button for Mobile / Quick Contact (capped to <= 15% mobile viewport) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <a
          href="https://wa.me/4917643416174"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center border border-emerald-400/30"
          aria-label="WhatsApp Chat starten"
        >
          <MessageSquare className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
