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
import { PartnerLogosBanner } from './components/ProviderLogos';
import { Language, ServiceType } from './types';
import { VergleichPage } from './platform/VergleichPage';
import { StatusPage } from './platform/StatusPage';
import { ChatWidget } from './platform/ChatWidget';


export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [bookingService, setBookingService] = useState<ServiceType | 'all'>('all');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);

  const [route, setRoute] = useState<string>(() => window.location.hash);

  useEffect(() => {
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
      />

      {/* Main Content: Plattform-Seiten über #/…, sonst die Startseite */}
      <main className="flex-1">
        {route.startsWith('#/vergleich') ? (
          <VergleichPage onOpenPrivacy={() => setLegalModal('datenschutz')} />
        ) : route.startsWith('#/status') ? (
          <StatusPage initialId={route.split('/')[2] || undefined} />
        ) : (
          <>
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
        />

        {/* 4. Switching Journey Process */}
        <ProcessSection currentLang={currentLang} />

        {/* Transparent advice and commission disclosure */}
        <TransparencySection currentLang={currentLang} onOpenBooking={scrollToBooking} />

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
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        currentLang={currentLang}
        onOpenLegal={setLegalModal}
      />

      {/* Legal Modals (Impressum & Datenschutz) */}
      <LegalModals
        activeModal={legalModal}
        onClose={() => setLegalModal(null)}
        currentLang={currentLang}
      />


      {/* Chat-Assistent mit WhatsApp- und Termin-Schnellzugriff */}
      <ChatWidget onOpenBooking={scrollToBooking} />
    </div>
  );
}
