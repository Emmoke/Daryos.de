import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarCheck, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { api, ApiError } from './api';
import chatSymbol from '../assets/brand/daryos-chat-symbol-hell.webp';

type Turn = { role: 'user' | 'assistant'; text: string };

const WHATSAPP_URL = 'https://wa.me/4917643416174?text=' + encodeURIComponent('Hallo Daryos, ich habe eine Frage.');
const SUGGESTIONS = ['Kostet die Beratung etwas?', 'Welche Unterlagen brauche ich?', 'Wie läuft ein Anbieterwechsel ab?'];
const STORAGE_KEY = 'daryos_chat';
const GREETING: Turn = {
  role: 'assistant',
  text: 'Hallo! Ich bin der digitale Assistent von Daryos. Ich beantworte allgemeine Fragen zu unserem Service. Für konkrete Angebote nutzen Sie den Tarifvergleich oder die persönliche Beratung.',
};

function loadHistory(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Turn[]) : null;
    return Array.isArray(parsed) && parsed.length ? parsed.slice(-20) : [GREETING];
  } catch {
    return [GREETING];
  }
}

export function ChatWidget({ onOpenBooking }: { onOpenBooking: () => void }) {
  const [open, setOpen] = useState(false);
  // Schließen mit Escape und beim Seitenwechsel – sonst verdeckt das Fenster auf dem Handy die Seite
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onHash = () => setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); };
  }, [open]);
  const [turns, setTurns] = useState<Turn[]>(loadHistory);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [storesTranscripts, setStoresTranscripts] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || available !== null) return;
    api.integrations().then((i) => { setAvailable(i.chat?.configured ?? false); setStoresTranscripts(!!i.chat?.storesTranscripts); }).catch(() => setAvailable(false));
  }, [open, available]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-20)));
    } catch {
      // ignore
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, open]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: Turn[] = [...turns, { role: 'user', text: t.slice(0, 1000) }];
    setTurns(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      // Begrüßung nicht mitsenden – sie ist kein Teil des echten Gesprächs
      const history = next.filter((m) => m.text !== GREETING.text).slice(-12);
      const r = await api.chat(history, sessionRef.current);
      if (r.sessionId) sessionRef.current = r.sessionId;
      setTurns((cur) => [...cur, { role: 'assistant', text: r.reply }]);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 503 || err.status === 0)) setAvailable(false);
      setError(err instanceof ApiError ? err.message : 'Der Assistent ist gerade nicht erreichbar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Daryos Chat-Assistent"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-[calc(100vw-2.5rem)] max-w-sm h-[min(560px,calc(100vh-7rem))] flex flex-col rounded-2xl bg-white text-slate-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/5 overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3.5 bg-slate-900 text-white">
              <span className="relative grid place-items-center w-10 h-10">
                <img src={chatSymbol} alt="" width={40} height={40} className="w-10 h-10" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-slate-900 ${available === false ? 'bg-slate-400' : 'bg-emerald-400'}`} aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight"><span className="font-logo italic font-bold text-base text-blue-300">Daryos</span> <span className="font-semibold">Kundenservice</span></p>
                <p className="text-[11px] text-slate-300">{available === false ? 'Wir antworten persönlich per WhatsApp' : 'Digitaler Assistent · Antworten sofort'}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Chat schließen" className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50" aria-live="polite">
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      t.role === 'user' ? 'bg-slate-900 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {t.text}
                  </p>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> Assistent schreibt …
                </div>
              )}
              {available === false && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                  Der automatische Assistent ist hier noch nicht aktiv. Schreiben Sie uns direkt per WhatsApp oder buchen Sie einen Termin – wir antworten persönlich.
                </div>
              )}
              {error && available !== false && <p role="alert" className="text-xs text-rose-600">{error}</p>}
              {turns.length === 1 && available !== false && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-3 pt-3 pb-3 border-t border-slate-200 space-y-2 bg-white">
              <div className="flex gap-2">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> WhatsApp
                </a>
                <button onClick={() => { setOpen(false); onOpenBooking(); }} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
                  <CalendarCheck className="w-3.5 h-3.5" aria-hidden /> Termin
                </button>
              </div>
              {available !== false && (
                <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                  <label htmlFor="chat-input" className="sr-only">Nachricht</label>
                  <input
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={1000}
                    placeholder="Ihre Frage …"
                    autoComplete="off"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button disabled={busy || !input.trim()} aria-label="Senden" className="px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
              <p className="text-[10px] text-slate-400 text-center">
                Bitte keine Bank-, Ausweis- oder Zählerdaten im Chat senden.
                {storesTranscripts && available && ' Chatverläufe werden zur Verbesserung des Service 30 Tage gespeichert (ohne IP-Adresse).'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Chat schließen' : 'Chat mit Daryos öffnen'}
        aria-expanded={open}
        className="group relative grid place-items-center w-16 h-16 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl"
      >
        {open ? (
          <span className="grid place-items-center w-12 h-12 rounded-full bg-white text-slate-900 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.55)]"><X className="w-5 h-5" /></span>
        ) : (
          <img src={chatSymbol} alt="" width={64} height={64} className="w-16 h-16 drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]" />
        )}
      </button>
    </div>
  );
}
