import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { api, ApiError, dateTime } from '../api';
import { Badge, Button, Card, Empty, Field, inputCls, Notice, PageHeader, Spinner, Stat } from '../ui';

type Tab = 'auswertung' | 'gespraeche' | 'anweisungen' | 'wissen' | 'werkzeuge' | 'testen';

const INSTRUCTION_EXAMPLES = [
  'Sprich Kunden mit „Sie“ an und antworte in höchstens 4 Sätzen.',
  'Weise bei Gewerbekunden darauf hin, dass wir eine persönliche Beratung empfehlen.',
  'Wenn nach Öko-Tarifen gefragt wird, erwähne, dass die Angaben vom Anbieter stammen.',
];

export function AssistantPage() {
  const [tab, setTab] = useState<Tab>('auswertung');
  const [data, setData] = useState<{ settings: any; stats: any; configured: boolean; detail: string } | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const reload = useCallback(() => api.assistant().then(setData).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true })), []);
  useEffect(() => { reload(); }, [reload]);

  const save = async (patch: Record<string, unknown>, ok = 'Gespeichert. Gilt ab der nächsten Antwort.') => {
    setMsg(null);
    try {
      const r = await api.saveAssistant({ ...data!.settings, ...patch });
      setData((d) => (d ? { ...d, settings: r.settings } : d));
      setMsg({ text: ok });
      return true;
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
      return false;
    }
  };

  return (
    <>
      <PageHeader title="KI-Assistent" description="Chat auf der Webseite und Antworten im WhatsApp-Bot: auswerten, Anweisungen und Wissen anpassen, Werkzeuge festlegen." />
      {data && !data.configured && <div className="mb-4"><Notice tone="amber">Der KI-Assistent antwortet noch nicht, weil kein Gemini-Schlüssel hinterlegt ist. Einstellungen hier werden trotzdem gespeichert und gelten, sobald er eingerichtet ist (siehe Einstellungen → Verbindungen).</Notice></div>}
      <div role="tablist" className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {([['auswertung', 'Auswertung'], ['gespraeche', 'Gespräche'], ['anweisungen', 'Anweisungen'], ['wissen', 'Wissen'], ['werkzeuge', 'Werkzeuge'], ['testen', 'Testen']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setMsg(null); }} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {msg && <div className="mb-4"><Notice tone={msg.error ? 'red' : 'green'}>{msg.text}</Notice></div>}
      {!data ? <Spinner /> : (
        <>
          {tab === 'auswertung' && <Stats stats={data.stats} onOpen={() => setTab('gespraeche')} />}
          {tab === 'gespraeche' && <Sessions />}
          {tab === 'anweisungen' && <Instructions value={data.settings.extraInstructions} onSave={(v) => save({ extraInstructions: v })} />}
          {tab === 'wissen' && <Knowledge value={data.settings.knowledge} onSave={(v) => save({ knowledge: v })} />}
          {tab === 'werkzeuge' && <Tools settings={data.settings} onSave={(patch) => save(patch)} />}
          {tab === 'testen' && <Test configured={data.configured} />}
        </>
      )}
    </>
  );
}

function Stats({ stats, onOpen }: { stats: any; onOpen: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Gespräche gesamt" value={stats.sessions} sub={`${stats.sessionsLast7Days} in den letzten 7 Tagen`} />
        <Stat label="Fragen von Kunden" value={stats.userMessages} sub={`Ø ${stats.avgMessagesPerSession} pro Gespräch`} />
        <Stat label="Wunsch nach Kontakt" value={`${stats.handoverRate} %`} sub="Termin, Rückruf, WhatsApp, Mitarbeiter" />
        <Stat label="Nicht beantwortet" value={stats.failedReplies} sub="KI nicht erreichbar/eingerichtet" tone={stats.failedReplies ? 'amber' : undefined} />
      </div>
      <Card title="Häufigste Einstiegsfragen" actions={<Button size="sm" variant="ghost" onClick={onOpen}>Alle Gespräche</Button>}>
        {stats.topQuestions.length === 0 ? <Empty>Noch keine Gespräche gespeichert.</Empty> : (
          <ol className="divide-y divide-slate-100 -my-2">
            {stats.topQuestions.map((q: any) => (
              <li key={q.question} className="flex justify-between gap-4 py-2 text-sm"><span>„{q.question}“</span><span className="tabular-nums text-slate-500">{q.count}×</span></li>
            ))}
          </ol>
        )}
      </Card>
      <Notice>Tipp: Wiederkehrende Fragen, die der Assistent nicht gut beantwortet, unter „Wissen“ als Frage & Antwort ergänzen.</Notice>
    </div>
  );
}

function Sessions() {
  const [list, setList] = useState<any[] | null>(null);
  const [open, setOpen] = useState<any>(null);
  const reload = useCallback(() => api.chatSessions().then((r) => setList(r.sessions)).catch(() => setList([])), []);
  useEffect(() => { reload(); }, [reload]);
  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-start">
      <Card padded={false}>
        {!list ? <Spinner /> : list.length === 0 ? <Empty>Noch keine Gespräche. Gespräche werden 30 Tage gespeichert.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {list.map((s) => (
              <li key={s.id}>
                <button onClick={() => api.chatSession(s.id).then((r) => setOpen(r.session))} className={`w-full text-left px-5 py-3 ${open?.id === s.id ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                  <p className="text-sm truncate">„{s.firstQuestion}“</p>
                  <p className="text-xs text-slate-500">{dateTime(s.updatedAt)} · {s.messages} Nachrichten {s.handover && <Badge tone="amber">Kontaktwunsch</Badge>} {s.failed > 0 && <Badge tone="red">{s.failed}× ohne Antwort</Badge>}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {open ? (
        <Card title={`Gespräch vom ${dateTime(open.startedAt)}`} actions={<Button size="sm" variant="danger" onClick={async () => { if (window.confirm('Gespräch endgültig löschen?')) { await api.deleteChatSession(open.id); setOpen(null); reload(); } }}><Trash2 className="w-3.5 h-3.5" aria-hidden /> Löschen</Button>}>
          <ol className="space-y-2 max-h-[520px] overflow-y-auto">
            {open.messages.map((m: any, i: number) => (
              <li key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{m.text}</p>
              </li>
            ))}
          </ol>
        </Card>
      ) : <Card><Empty>Gespräch auswählen.</Empty></Card>}
    </div>
  );
}

function Instructions({ value, onSave }: { value: string; onSave: (v: string) => Promise<boolean> }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Zusätzliche Anweisungen (Prompt)">
      <p className="text-sm text-slate-600 mb-3">Hier legen Sie fest, <strong>wie</strong> der Assistent antwortet (Ton, Länge, Schwerpunkte). Die festen Regeln – keine erfundenen Preise, keine Vertragszusagen, Übergabe an einen Menschen – bleiben immer gültig und können hier nicht abgeschaltet werden.</p>
      <textarea value={v} onChange={(e) => setV(e.target.value)} rows={8} maxLength={4000} className={`${inputCls} h-auto py-2`} placeholder="z. B. Antworte kurz und freundlich, höchstens 4 Sätze." />
      <div className="mt-2 flex flex-wrap gap-2">
        {INSTRUCTION_EXAMPLES.map((ex) => <button key={ex} type="button" onClick={() => setV((x) => (x ? `${x}\n${ex}` : ex))} className="text-xs rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-50">+ {ex}</button>)}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">{v.length}/4000 Zeichen</span>
        <Button variant="primary" loading={busy} onClick={async () => { setBusy(true); await onSave(v); setBusy(false); }}>Speichern</Button>
      </div>
    </Card>
  );
}

function Knowledge({ value, onSave }: { value: any[]; onSave: (v: any[]) => Promise<boolean> }) {
  const [items, setItems] = useState<any[]>(value.length ? value : []);
  const [busy, setBusy] = useState(false);
  const set = (i: number, k: 'question' | 'answer', val: string) => setItems((s) => s.map((x, j) => (j === i ? { ...x, [k]: val } : x)));
  return (
    <Card title="Eigenes Wissen (Fragen & Antworten)" actions={<Button size="sm" onClick={() => setItems((s) => [...s, { question: '', answer: '' }])}><Plus className="w-3.5 h-3.5" aria-hidden /> Eintrag</Button>}>
      <p className="text-sm text-slate-600 mb-4">Ergänzt die Leistungen und FAQ der Webseite. Der Assistent nutzt diese Antworten wörtlich als Grundlage. Bitte keine Preise eintragen, die sich ändern – dafür gibt es den Tarifkatalog.</p>
      {items.length === 0 && <Empty>Noch keine Einträge. Beispiel: „Haben Sie samstags geöffnet?“ – „Termine am Samstag nach Vereinbarung.“</Empty>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id ?? i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
            <Field label="Frage"><input value={it.question} onChange={(e) => set(i, 'question', e.target.value)} maxLength={300} className={inputCls} /></Field>
            <Field label="Antwort"><textarea value={it.answer} onChange={(e) => set(i, 'answer', e.target.value)} maxLength={2000} rows={2} className={`${inputCls} h-auto py-2`} /></Field>
            <Button variant="ghost" className="mt-5" aria-label="Eintrag entfernen" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="primary" loading={busy} onClick={async () => { setBusy(true); await onSave(items); setBusy(false); }}>Speichern</Button></div>
    </Card>
  );
}

function Tools({ settings, onSave }: { settings: any; onSave: (patch: Record<string, unknown>) => Promise<boolean> }) {
  const [tools, setTools] = useState(settings.tools);
  const [store, setStore] = useState(settings.storeTranscripts);
  const [busy, setBusy] = useState(false);
  const items: [string, string, string][] = [
    ['comparison', 'Tarifvergleich empfehlen', 'Für konkrete Preise auf den Online-Tarifvergleich verweisen.'],
    ['booking', 'Termin anbieten', 'Bei Beratungswunsch die Terminbuchung anbieten.'],
    ['whatsapp', 'WhatsApp / Rückruf anbieten', 'Persönlichen Kontakt per WhatsApp oder Rückruf vorschlagen.'],
    ['status', 'Anfragestatus erklären', 'Auf die Status-Seite mit der Anfrage-ID verweisen.'],
  ];
  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Werkzeuge – was der Assistent anbieten darf">
        <ul className="space-y-3">
          {items.map(([k, label, desc]) => (
            <li key={k}>
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={tools[k]} onChange={(e) => setTools({ ...tools, [k]: e.target.checked })} className="mt-1 w-4 h-4 accent-slate-900" />
                <span><span className="text-sm font-medium">{label}</span><span className="block text-xs text-slate-500">{desc}</span></span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Datenschutz">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={store} onChange={(e) => setStore(e.target.checked)} className="mt-1 w-4 h-4 accent-slate-900" />
          <span><span className="text-sm font-medium">Chatverläufe 30 Tage speichern</span><span className="block text-xs text-slate-500">Für die Auswertung. Ohne IP-Adresse; Besucher sehen einen Hinweis im Chat. In der Datenschutzerklärung erwähnen.</span></span>
        </label>
      </Card>
      <div className="flex justify-end"><Button variant="primary" loading={busy} onClick={async () => { setBusy(true); await onSave({ tools, storeTranscripts: store }); setBusy(false); }}>Speichern</Button></div>
    </div>
  );
}

function Test({ configured }: { configured: boolean }) {
  const [q, setQ] = useState('Was kostet die Beratung?');
  const [reply, setReply] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Assistent testen">
      <p className="text-sm text-slate-600 mb-3">Stellen Sie eine Frage wie ein Kunde. Die Antwort nutzt Ihre aktuellen Einstellungen und wird nicht gespeichert.</p>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setReply(null); try { setReply({ text: (await api.testAssistant(q)).reply }); } catch (err) { setReply({ text: err instanceof ApiError ? err.message : 'Fehler', error: true }); } finally { setBusy(false); } }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={1000} className={inputCls} aria-label="Testfrage" />
        <Button variant="primary" loading={busy}><Send className="w-3.5 h-3.5" aria-hidden /> Fragen</Button>
      </form>
      {reply && <div className={`mt-4 rounded-lg px-4 py-3 text-sm whitespace-pre-line ${reply.error ? 'bg-rose-50 text-rose-800' : 'bg-slate-50'}`}>{reply.text}</div>}
    </Card>
  );
}
