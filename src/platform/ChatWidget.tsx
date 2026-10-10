import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, CalendarCheck, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { api, ApiError } from './api';

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
  const [turns, setTurns] = useState<Turn[]>(loadHistory);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || available !== null) return;
    api.integrations().then((i) => setAvailable(i.chat?.configured ?? false)).catch(() => setAvailable(false));
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
      const r = await api.chat(history);
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
            className="w-[calc(100vw-2.5rem)] max-w-sm h-[min(560px,calc(100vh-7rem))] flex flex-col rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-indigo-500/10 to-orange-500/10">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Bot className="w-5 h-5 text-white" aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">Daryos Assistent</p>
                <p className="text-[11px] text-slate-400">{available === false ? 'Persönlicher Kontakt' : 'Automatische Antworten · unverbindlich'}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Chat schließen" className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      t.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white/[0.06] border border-white/10 text-slate-200 rounded-bl-md'
                    }`}
                  >
                    {t.text}
                  </p>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> Assistent schreibt …
                </div>
              )}
              {available === false && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  Der automatische Assistent ist hier noch nicht aktiv. Schreiben Sie uns direkt per WhatsApp oder buchen Sie einen Termin – wir antworten persönlich.
                </div>
              )}
              {error && available !== false && <p role="alert" className="text-xs text-rose-400">{error}</p>}
              {turns.length === 1 && available !== false && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-slate-200 hover:bg-white/10">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-3 pt-2 pb-3 border-t border-white/10 space-y-2">
              <div className="flex gap-2">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden /> WhatsApp
                </a>
                <button onClick={() => { setOpen(false); onOpenBooking(); }} className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-white/15 text-slate-200 hover:bg-white/10">
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
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button disabled={busy || !input.trim()} aria-label="Senden" className="px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
              <p className="text-[10px] text-slate-500 text-center">Bitte keine Bank-, Ausweis- oder Zählerdaten im Chat senden.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Chat schließen' : 'Chat mit Daryos öffnen'}
        aria-expanded={open}
        className="relative grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-600/40 hover:scale-105 transition-transform"
      >
        {!open && <span className="absolute inset-0 rounded-full animate-ping bg-blue-500/30" aria-hidden />}
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
