import React, { useState } from 'react';
import { CalendarCheck, MapPin, MessageSquare, Phone, Video } from 'lucide-react';
import { Language, ConsultationType, ServiceType } from '../types';
import { translations } from '../data/translations';

interface BookingSectionProps {
  currentLang: Language;
  preselectedService?: ServiceType | 'all';
  initialNotes?: string;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  currentLang,
  preselectedService = 'all',
}) => {
  const t = translations[currentLang];
  const [consultationType, setConsultationType] = useState<ConsultationType>('vor-ort');
  const [serviceType, setServiceType] = useState<ServiceType | 'all'>(preselectedService);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const timeSlots = ['09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const getServiceLabel = (service: ServiceType | 'all') => {
    switch (service) {
      case 'strom': return 'Stromvertrag';
      case 'gas': return 'Gasvertrag';
      case 'internet': return 'Internet & Festnetz';
      case 'kfz': return 'Autoversicherung';
      default: return 'Rundum-Tarifvergleich';
    }
  };

  const getConsultationLabel = (type: ConsultationType) => {
    switch (type) {
      case 'vor-ort': return 'Vor Ort in Leipzig';
      case 'telefon': return 'Telefonischer Rückruf';
      case 'video': return 'Video-Beratung';
      case 'whatsapp': return 'Beratung per WhatsApp';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Hallo Daryos, ich möchte eine unverbindliche Beratung anfragen.\n\nBereich: ${getServiceLabel(serviceType)}\nGewünschter Kontakt: ${getConsultationLabel(consultationType)}\nWunschtermin: ${selectedDate} um ${selectedTime} Uhr\n\nBitte bestätigen Sie den Termin und teilen Sie mir mit, welche Informationen Sie für die Prüfung verfügbarer Angebote Ihrer Vertragspartner benötigen.`;
    setWhatsAppUrl(`https://wa.me/4917643416174?text=${encodeURIComponent(message)}`);
  };

  return (
    <section id="booking" className="py-20 bg-[#07070a] border-t border-white/[0.08] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <div className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
            {t.booking.sectionSub}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.booking.sectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Wählen Sie einen Wunschtermin und senden Sie Ihre Anfrage selbst per WhatsApp. Der Termin gilt erst nach unserer Rückmeldung als bestätigt.
          </p>
        </div>

        <div className="bg-[#0b0c10] rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-xl">
          {!whatsAppUrl ? (
            <form onSubmit={handleSubmit} className="space-y-8">
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
                    { id: 'kfz', label: '🚗 Autoversicherung' },
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>WhatsApp-Anfrage vorbereiten</span>
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-3">
                  Es werden hier keine Kontaktdaten erfasst. WhatsApp öffnet sich erst nach Ihrer Auswahl; die Nachricht wird nicht automatisch gesendet.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-center" aria-live="polite">
              <p className="text-sm text-slate-300">
                Ihre Anfrage wurde noch nicht gesendet und der Termin ist noch nicht bestätigt. Öffnen Sie WhatsApp und senden Sie die vorbereitete Nachricht, wenn Sie fortfahren möchten.
              </p>
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp öffnen
              </a>
              <div>
                <button
                  type="button"
                  onClick={() => setWhatsAppUrl(null)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Angaben ändern
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
