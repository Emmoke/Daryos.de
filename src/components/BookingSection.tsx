import React, { useState } from 'react';
import { CalendarCheck, MapPin, Phone, Video, MessageSquare, Check, Download, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Language, ConsultationType, ServiceType, AppointmentData } from '../types';
import { translations } from '../data/translations';

interface BookingSectionProps {
  currentLang: Language;
  preselectedService?: ServiceType | 'all';
  initialNotes?: string;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  currentLang,
  preselectedService = 'all',
  initialNotes = '',
}) => {
  const t = translations[currentLang];

  const [consultationType, setConsultationType] = useState<ConsultationType>('vor-ort');
  const [serviceType, setServiceType] = useState<ServiceType | 'all'>(preselectedService);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to tomorrow or next business day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // skip Sunday
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>(initialNotes);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [confirmedData, setConfirmedData] = useState<AppointmentData | null>(null);

  const timeSlots = [
    '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    const data: AppointmentData = {
      consultationType,
      serviceType,
      date: selectedDate,
      timeSlot: selectedTime,
      fullName,
      phone,
      email,
      notes,
    };
    setConfirmedData(data);
    setIsSubmitted(true);

    // Privacy: do not persist personal booking details in browser storage.
    // The user can explicitly continue via WhatsApp from the confirmation screen.
  };

  const getServiceLabel = (st: ServiceType | 'all') => {
    switch (st) {
      case 'strom': return 'Stromvertrag';
      case 'gas': return 'Gasvertrag';
      case 'internet': return 'Internet & Festnetz';
      case 'kfz': return 'Autoversicherung';
      default: return 'Rundum-Tarifvergleich';
    }
  };

  const getConsultationLabel = (ct: ConsultationType) => {
    switch (ct) {
      case 'vor-ort': return 'Vor Ort im Büro (Rotfuchsstraße 1, 04329 Leipzig)';
      case 'telefon': return 'Telefonischer Rückruf';
      case 'video': return 'Video-Beratung';
      case 'whatsapp': return 'Beratung per WhatsApp';
    }
  };

  // Generate .ics file for calendar export
  const exportICS = () => {
    if (!confirmedData) return;
    const [year, month, day] = confirmedData.date.split('-').map(Number);
    const [hours, minutes] = confirmedData.timeSlot.split(':').map(Number);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const startStr = `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
    const endStr = `${year}${pad(month)}${pad(day)}T${pad(hours + 1)}${pad(minutes)}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daryos Tarifberatung Leipzig//DE',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@daryos.de`,
      `DTSTAMP:${startStr}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Daryos Beratungstermin: ${getServiceLabel(confirmedData.serviceType)}`,
      `DESCRIPTION:Beratungstermin mit Daryos Leipzig.\\nFormat: ${getConsultationLabel(confirmedData.consultationType)}\\nTelefon: +49 176 43416174`,
      'LOCATION:Rotfuchsstraße 1, 04329 Leipzig, Deutschland',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daryos-Beratung-${confirmedData.date}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmViaWhatsApp = () => {
    if (!confirmedData) return;
    const msg = `Hallo Daryos, ich habe eine Terminanfrage eingereicht:\n\n• Name: ${confirmedData.fullName}\n• Format: ${getConsultationLabel(confirmedData.consultationType)}\n• Thema: ${getServiceLabel(confirmedData.serviceType)}\n• Datum: ${confirmedData.date} um ${confirmedData.timeSlot} Uhr\n• Telefon: ${confirmedData.phone}\n${confirmedData.notes ? `• Notiz: ${confirmedData.notes}` : ''}`;
    window.open(`https://wa.me/4917643416174?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section id="booking" className="py-20 bg-[#07070a] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
            {t.booking.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.booking.sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            {t.booking.sectionDesc}
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0b0c10] rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-xl">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Format */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  {t.booking.step1}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'vor-ort', label: t.booking.typeInPerson, icon: MapPin },
                    { id: 'telefon', label: t.booking.typePhone, icon: Phone },
                    { id: 'video', label: t.booking.typeVideo, icon: Video },
                    { id: 'whatsapp', label: t.booking.typeWhatsApp, icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setConsultationType(item.id as ConsultationType)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                          consultationType === item.id
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${consultationType === item.id ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  {t.booking.step2}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { id: 'all', label: 'Komplett-Check' },
                    { id: 'strom', label: '⚡ Strom' },
                    { id: 'gas', label: '🔥 Gas' },
                    { id: 'internet', label: '🌐 Internet' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setServiceType(item.id as ServiceType | 'all')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border cursor-pointer text-center truncate ${
                        serviceType === item.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t.booking.dateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Mo-Fr 09:00 - 18:00 Uhr | Sa 10:00 - 14:00 Uhr
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t.booking.timeLabel}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-1 text-xs font-mono font-medium rounded-lg border text-center cursor-pointer transition-colors ${
                          selectedTime === slot
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4: Contact Details */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {t.booking.step4}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.booking.nameLabel} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z. B. Max Mustermann"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.booking.phoneLabel} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="z. B. 0176 12345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.booking.emailLabel} (optional)
                    </label>
                    <input
                      type="email"
                      placeholder="name@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.booking.notesLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Bisher bei Stadtwerke Leipzig, Sparpotenzial prüfen"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>{t.booking.submitBtn}</span>
                </button>
                <div className="text-center text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% kostenlose und unverbindliche Beratung ohne Weitergabe von Daten</span>
                </div>
              </div>
            </form>
          ) : (
            /* Confirmation State */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {t.booking.confirmationTitle}
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {t.booking.confirmationDesc}
                </p>
              </div>

              {confirmedData && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Kunde:</span>
                    <span className="font-semibold text-white">{confirmedData.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Thema:</span>
                    <span className="font-semibold text-blue-400">{getServiceLabel(confirmedData.serviceType)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-semibold text-slate-200">{getConsultationLabel(confirmedData.consultationType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Datum & Uhrzeit:</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {confirmedData.date} um {confirmedData.timeSlot} Uhr
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={confirmViaWhatsApp}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.booking.openWhatsAppAction}</span>
                </button>

                <button
                  type="button"
                  onClick={exportICS}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.booking.exportCalendar}</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {t.booking.newBooking}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
