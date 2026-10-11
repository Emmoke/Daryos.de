import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getConsent, setConsent } from '../platform/consent';

// Einwilligungs-Banner: beide Wahlmöglichkeiten gleichwertig, jederzeit über „Cookie-Einstellungen“ im Fuß änderbar
export function ConsentBanner({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const [open, setOpen] = useState(() => !getConsent());
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('daryos:consent-open', show);
    return () => window.removeEventListener('daryos:consent-open', show);
  }, []);
  if (!open) return null;
  const choose = (statistik: boolean) => {
    setConsent(statistik);
    setOpen(false);
  };
  const current = getConsent();
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 p-5 text-sm text-slate-300 shadow-2xl backdrop-blur">
        <p id="consent-title" className="mb-2 flex items-center gap-2 text-base font-semibold text-white"><ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden /> Datenschutz-Einstellungen</p>
        <p>
          Wir verwenden <strong>keine Werbe- oder Tracking-Cookies</strong> und keine Dienste von Drittanbietern zur Analyse.
          <strong> Notwendig</strong> ist nur ein Anmelde-Cookie, wenn Sie sich in „Mein Konto“ anmelden.
          <strong> Optional</strong> zählen wir Seitenaufrufe anonym (ohne IP-Adresse, ohne Profil), um unser Angebot zu verbessern.
          {' '}<button onClick={onOpenPrivacy} className="underline hover:text-white">Datenschutzerklärung</button>
        </p>
        {current && <p className="mt-2 text-xs text-slate-400">Aktuell: {current.statistik ? 'Statistik erlaubt' : 'nur notwendige'} (seit {new Date(current.at).toLocaleDateString('de-DE')})</p>}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={() => choose(false)} className="rounded-lg border border-slate-600 px-4 py-2.5 font-semibold text-white hover:bg-slate-800">Nur notwendige</button>
          <button onClick={() => choose(true)} className="rounded-lg border border-slate-600 px-4 py-2.5 font-semibold text-white hover:bg-slate-800">Statistik erlauben</button>
        </div>
      </div>
    </div>
  );
}
