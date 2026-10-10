import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, Loader2, Send, Sparkles, X, CheckCircle2, Bell } from 'lucide-react';
import { api, type BriefingItem } from './api';

type Msg = { role: 'user' | 'assistant'; text: string };
const STORE_KEY = 'daryos-copilot-chat';
const SUGGESTIONS = [
  'Was soll ich heute zuerst erledigen?',
  'Erstelle mir einen Plan für diese Woche.',
  'Schreibe eine freundliche Nachfass-E-Mail an einen Kunden, der auf unser Angebot noch nicht geantwortet hat.',
  'Welche Tarife sollte ich aktualisieren?',
  'Welche Abläufe kann ich noch automatisieren?',
  'Welche Fragen stellen Kunden im Chat am häufigsten – was sollte ich ins Wissen aufnehmen?',
];

const loadChat = (): Msg[] => {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
};

// Anfrage-IDs und Verwaltungs-Links im Antworttext anklickbar machen, **fett** darstellen
function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const content = line.replace(/^\s*[-*•]\s+/, '');
        const parts = content.split(/(DY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}|\*\*[^*]+\*\*)/g);
        const body = parts.map((p, j) =>
          /^DY-/.test(p) ? <a key={j} href={`#/anfragen/${p}`} onClick={onNavigate} className="font-mono text-indigo-600 hover:underline">{p}</a>
          : /^\*\*/.test(p) ? <strong key={j}>{p.slice(2, -2)}</strong>
          : <React.Fragment key={j}>{p}</React.Fragment>,
        );
        if (!line.trim()) return <div key={i} className="h-2" />;
        return bullet ? <div key={i} className="flex gap-2"><span aria-hidden>•</span><span>{body}</span></div> : <p key={i}>{body}</p>;
      })}
    </>
  );
}

const ICON = { wichtig: AlertTriangle, hinweis: Bell, info: Info, ok: CheckCircle2 };
const TONE = { wichtig: 'text-rose-600', hinweis: 'text-amber-600', info: 'text-sky-600', ok: 'text-emerald-600' };

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<{ since: string | null; items: BriefingItem[]; aiAvailable: boolean } | null>(null);
  const [messages, setMessages] = useState<Msg[]>(loadChat);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  // Beim Öffnen der Verwaltung: Lagebild holen und bei Wichtigem automatisch anzeigen (einmal pro Sitzung)
  useEffect(() => {
    api.copilotBriefing().then((b) => {
      setBriefing(b);
      const urgent = b.items.some((x) => x.level === 'wichtig' || x.level === 'hinweis');
      if (urgent && !sessionStorage.getItem('daryos-copilot-greeted')) setOpen(true);
      sessionStorage.setItem('daryos-copilot-greeted', '1');
      api.copilotSeen().catch(() => {});
    }).catch(() => {});
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* egal */ }
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user' as const, text: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const { reply } = await api.copilotChat(next);
      setMessages([...next, { role: 'assistant', text: reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const urgentCount = briefing?.items.filter((x) => x.level === 'wichtig').length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-800" aria-label="Assistent öffnen">
          <Sparkles className="w-4 h-4" aria-hidden /> Assistent
          {urgentCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold">{urgentCount}</span>}
        </button>
      )}
      {open && (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="Verwaltungs-Assistent">
          <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-semibold">Ihr Assistent</p>
              <p className="text-[11px] text-slate-500">Berät und bereitet vor – ausführen tun Sie.</p>
            </div>
            {messages.length > 0 && <button onClick={() => setMessages([])} className="text-xs text-slate-500 hover:text-slate-800">Neues Gespräch</button>}
            <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Schließen"><X className="w-4 h-4" /></button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium">{greeting}!{briefing?.since ? ` Seit Ihrem letzten Besuch (${new Date(briefing.since).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}):` : ' Das ist der aktuelle Stand:'}</p>
              {!briefing ? <Loader2 className="mt-2 w-4 h-4 animate-spin text-slate-400" /> : (
                <ul className="mt-2 space-y-1.5">
                  {briefing.items.map((b, i) => {
                    const I = ICON[b.level];
                    return (
                      <li key={i} className="flex gap-2">
                        <I className={`w-4 h-4 mt-0.5 shrink-0 ${TONE[b.level]}`} aria-hidden />
                        {b.href ? <a href={b.href} onClick={() => window.innerWidth < 1024 && setOpen(false)} className="hover:underline">{b.text}</a> : <span>{b.text}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ml-8 rounded-xl bg-slate-900 px-3 py-2 text-white' : 'mr-4 space-y-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-800'}>
                {m.role === 'user' ? m.text : <RichText text={m.text} onNavigate={() => window.innerWidth < 1024 && setOpen(false)} />}
              </div>
            ))}
            {busy && <p className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Denkt nach …</p>}
            {error && <p role="alert" className="text-rose-600">{error}</p>}

            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Fragen Sie zum Beispiel:</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={briefing?.aiAvailable === false} className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50">{s}</button>
                ))}
                {briefing?.aiAvailable === false && <p className="text-xs text-amber-700">Für den Chat bitte Gemini unter <a href="#/einstellungen" className="underline">Einstellungen → Verbindungen</a> eintragen. Das Lagebild oben funktioniert auch ohne.</p>}
              </div>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="copilot-input" className="sr-only">Nachricht an den Assistenten</label>
              <textarea id="copilot-input" rows={2} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Frage, Aufgabe oder Text, den ich entwerfen soll …"
                className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none" />
              <button disabled={busy || !input.trim()} className="rounded-lg bg-slate-900 p-2.5 text-white disabled:opacity-40" aria-label="Senden"><Send className="w-4 h-4" /></button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Kundennamen und Kontaktdaten werden nicht an die KI übermittelt. Antworten bitte prüfen.</p>
          </form>
        </aside>
      )}
    </>
  );
}
