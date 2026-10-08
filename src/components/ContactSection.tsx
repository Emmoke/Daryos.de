import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface ContactSectionProps {
  currentLang: Language;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  const [isOpenNow, setIsOpenNow] = useState(false);

  useEffect(() => {
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

  return (
    <section id="contact" className="py-20 bg-slate-950 border-t border-slate-900 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                Persönlich vor Ort & digital
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t.contact.title}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400">{t.contact.addressLabel}</div>
                  <div className="text-sm font-bold text-white">
                    Rotfuchsstraße 1, 04329 Leipzig
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    (Stadtteil Paunsdorf / Heiterblick, gute Erreichbarkeit mit Tram & PKW)
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <Phone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400">Telefon / WhatsApp:</div>
                  <a
                    href="tel:+4917643416174"
                    className="text-sm font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    +49 176 43416174
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <Mail className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-400">E-Mail:</div>
                  <a
                    href="mailto:daryos.kreis@gmail.com"
                    className="text-sm font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    daryos.kreis@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+4917643416174"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors text-center flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{t.contact.callNow}</span>
              </a>

              <a
                href="https://wa.me/4917643416174"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors text-center flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Opening Hours & Maps Card */}
          <div className="lg:col-span-7 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>{t.contact.hoursTitle}</span>
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
                  <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className={isOpenNow ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                    {isOpenNow ? t.topbar.openNow : t.topbar.closedNow}
                  </span>
                </div>
              </div>

              {/* Hours Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Montag – Freitag:</span>
                  <span className="font-bold text-white">09:00 – 18:00 Uhr</span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Samstag:</span>
                  <span className="font-bold text-white">10:00 – 14:00 Uhr</span>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-slate-800 h-64 bg-slate-950 relative">
                <iframe
                  title="Standort Daryos Leipzig"
                  className="w-full h-full border-0"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2492.203112260408!2d12.4411111!3d51.3438889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a6f95f4e0c3d2f%3A0x123456789abcdef!2sRotfuchsstra%C3%9Fe%201%2C%2004329%20Leipzig!5e0!3m2!1sde!2sde!4v1680000000000!5m2!1sde!2sde"
                  loading="lazy"
                />
              </div>

              <div className="flex justify-end">
                <a
                  href="https://maps.google.com/?q=Rotfuchsstraße+1,+04329+Leipzig"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t.contact.directionsBtn}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
