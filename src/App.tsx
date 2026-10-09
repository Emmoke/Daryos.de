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
import { PartnerLogosBanner } from './components/ProviderLogos';
import { Language, ServiceType } from './types';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('de');
  const [bookingService, setBookingService] = useState<ServiceType | 'all'>('all');
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);

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

  const handleApplySavingsToBooking = (service: ServiceType) => {
    setBookingService(service);
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

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero */}
        <Hero
          currentLang={currentLang}
          onOpenBooking={scrollToBooking}
          onScrollToCalc={scrollToCalc}
        />

        {/* 1.5 Provider examples */}
        <PartnerLogosBanner />

        {/* 2. Services Grid */}
        <ServicesSection
          currentLang={currentLang}
          onSelectServiceBooking={handleSelectServiceBooking}
        />

        {/* 3. Illustrative tariff estimate */}
        <CalculatorComponent
          currentLang={currentLang}
          onApplySavingsToBooking={handleApplySavingsToBooking}
        />

        {/* 4. Switching Journey Process */}
        <ProcessSection currentLang={currentLang} />

        {/* 5. Request a personal bill review */}
        <ContractUploadSection
          currentLang={currentLang}
        />

        {/* 6. Online Booking Assistant */}
        <BookingSection
          currentLang={currentLang}
          preselectedService={bookingService}
        />

        {/* 7. Reviews & Social Proof */}
        <ReviewsSection
          currentLang={currentLang}
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
      />

      {/* Legal Modals (Impressum & Datenschutz) */}
      <LegalModals
        activeModal={legalModal}
        onClose={() => setLegalModal(null)}
        currentLang={currentLang}
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
