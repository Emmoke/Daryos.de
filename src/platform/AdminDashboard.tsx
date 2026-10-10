import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, FileText, Loader2, LogOut, MessageCircle, RefreshCw, Send, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { REQUEST_STATUSES, STATUS_LABELS, type RankedOffer, type RequestStatus } from '../../shared/platform';
import { api, ApiError, dateTime, eur, type AdminListItem, type WaListItem } from './api';

type AdminUser = { role: 'eigentuemer'; email: string; name: string };

const STATUS_COLORS: Partial<Record<RequestStatus, string>> = {
  WAITING_FOR_ADMIN: 'bg-amber-500/20 text-amber-300',
  APPROVED: 'bg-blue-500/20 text-blue-300',
  SUBMITTED: 'bg-indigo-500/20 text-indigo-300',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-slate-600/30 text-slate-300',
  ERROR: 'bg-rose-500/20 text-rose-300',
};

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${STATUS_COLORS[status] ?? 'bg-slate-700/50 text-slate-300'}`}>{status}</span>;
}

export function AdminLogin({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="max-w-sm mx-auto px-4 py-16">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            onLogin((await api.admin.login(password)).user);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.');
          } finally {
            setBusy(false);
            setPassword('');
          }
        }}
        className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
      >
        <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-orange-400" aria-hidden /> Administrator-Anmeldung</h1>
        <label className="block text-sm">
          <span className="block mb-1 text-slate-300">Passwort</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500" />
        </label>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy || !password} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 font-semibold">
          {busy ? 'Prüfe …' : 'Anmelden'}
        </button>
      </form>
    </section>
  );
}

export function AdminDashboard({ user, onLogout, onOpenCockpit }: { user: AdminUser; onLogout: () => void; onOpenCockpit: () => void }) {
  const [tab, setTab] = useState<'requests' | 'whatsapp'>('requests');
  const [filter, setFilter] = useState<RequestStatus | ''>('WAITING_FOR_ADMIN');
  const [list, setList] = useState<AdminListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, { configured: boolean; detail: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setList((await api.admin.list(filter || undefined)).requests);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof ApiError ? err.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [filter, onLogout]);

  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    api.admin.integrations().then(setIntegrations).catch(() => {});
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Anfragen-Dashboard</h1>
          <p className="text-sm text-slate-400">Angemeldet als {user.name} ({user.email})</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenCockpit} className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm">Berater-Cockpit</button>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm"><LogOut className="w-4 h-4" aria-hidden /> Abmelden</button>
        </div>
      </header>

      {integrations && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries({ offerProvider: 'Angebotsquelle', email: 'E-Mail', whatsapp: 'WhatsApp', assistant: 'KI-Assistent' }).map(([k, label]) => {
            const i = integrations[k] as { configured: boolean; detail?: string; name?: string; isDemo?: boolean };
            const ok = i?.configured && !i.isDemo;
            return (
              <div key={k} className={`p-3 rounded-xl border text-xs ${ok ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-amber-600/50 bg-amber-900/10'}`}>
                <p className="font-semibold text-sm">{label}: {ok ? 'aktiv' : i?.isDemo ? 'DEMO' : 'nicht eingerichtet'}</p>
                <p className="text-slate-400 mt-1">{i?.detail ?? i?.name}</p>
              </div>
            );
          })}
        </div>
      )}

      <div role="tablist" className="flex gap-2 border-b border-slate-800">
        {([['requests', 'Anfragen'], ['whatsapp', 'WhatsApp-Postfach']] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'whatsapp' ? <WhatsAppInbox onUnauthorized={onLogout} /> : (<>
      <div className="flex flex-wrap items-center gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value as RequestStatus | '')} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm" aria-label="Status filtern">
          <option value="">Alle Status</option>
          {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{s} – {STATUS_LABELS[s]}</option>)}
        </select>
        <button onClick={reload} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden /> Aktualisieren
        </button>
        {error && <span role="alert" className="text-rose-400 text-sm">{error}</span>}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6">
        <ul className="space-y-2" aria-label="Anfragen">
          {list.length === 0 && <li className="text-slate-400 text-sm">Keine Anfragen in diesem Status.</li>}
          {list.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left p-3 rounded-xl border ${selectedId === r.id ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-sm">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm mt-1">{r.customerName ?? 'ohne Kontaktanfrage'} · {r.energyType === 'gas' ? 'Gas' : 'Strom'} · {r.postalCode}{r.isDemo && <span className="ml-2 text-[10px] font-bold text-amber-300">DEMO</span>}</p>
                {r.selectedOffer && <p className="text-xs text-slate-400 truncate">{r.selectedOffer}</p>}
                <p className="text-xs text-slate-500">{dateTime(r.updatedAt)}</p>
              </button>
            </li>
          ))}
        </ul>
        {selectedId ? <RequestDetail id={selectedId} onChanged={reload} onUnauthorized={onLogout} /> : <p className="text-slate-400 text-sm">Anfrage auswählen.</p>}
      </div>
      </>)}
    </section>
  );
}

function RequestDetail({ id, onChanged, onUnauthorized }: { id: string; onChanged: () => void; onUnauthorized: () => void }) {
  const [req, setReq] = useState<any>(null);
  const [note, setNote] = useState('');
  const [confirmationRef, setConfirmationRef] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReq(null);
    setMsg(null);
    api.admin.get(id).then((r) => setReq(r.request)).catch((err) => {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else setMsg({ text: err.message, error: true });
    });
  }, [id, onUnauthorized]);

  const run = async (fn: () => Promise<{ request: any }>, success: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setReq((await fn()).request);
      setNote('');
      setMsg({ text: success });
      onChanged();
    } catch (err) {
      setMsg({ text: err instanceof ApiError ? err.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };
  const act = (action: string, success: string) => run(() => api.admin.action(id, { action, note: note || undefined, providerConfirmationRef: confirmationRef || undefined }), success);

  if (!req) return <div>{msg ? <p className="text-rose-400">{msg.text}</p> : <Loader2 className="w-5 h-5 animate-spin" />}</div>;
  const sel: RankedOffer | undefined = req.comparison?.offers.find((o: RankedOffer) => o.offer.id === req.selectedOfferId);
  const s: RequestStatus = req.status;

  return (
    <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-sm">
      <header className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-lg font-bold font-mono">{req.id}</h2>
          <p className="text-slate-400">Erstellt {dateTime(req.createdAt)} · Löschung ab {dateTime(req.deleteAfter)}</p>
        </div>
        <StatusBadge status={s} />
      </header>

      {req.summary && (
        <section className="space-y-2">
          <h3 className="font-semibold">Zusammenfassung ({req.summary.generatedBy === 'gemini' ? 'KI' : 'regelbasiert'})</h3>
          <p className="text-slate-200 whitespace-pre-line">{req.summary.text}</p>
          {req.summary.warnings.map((w: string) => (
            <p key={w} className="flex gap-2 text-amber-300"><AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />{w}</p>
          ))}
          {req.summary.missingInformation.length > 0 && (
            <div>
              <p className="text-slate-400">Fehlende Angaben:</p>
              <ul className="list-disc pl-5 text-slate-300">{req.summary.missingInformation.map((m: string) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-1">Kunde</h3>
          {req.contact ? (
            <dl className="space-y-0.5">
              <div>{req.contact.name}</div>
              <div><a className="underline" href={`mailto:${req.contact.email}`}>{req.contact.email}</a></div>
              {req.contact.phone && <div>{req.contact.phone}</div>}
              <div className="text-slate-400">Kontaktweg: {req.contact.preferredChannel}{req.contact.consentWhatsapp ? ' · WhatsApp-Einwilligung erteilt' : ''}</div>
              <div className="text-slate-400">Einwilligung Datenschutz: {dateTime(req.contact.consentAt)}</div>
              {req.contact.message && <div className="mt-2 p-2 rounded bg-slate-800 whitespace-pre-line">{req.contact.message}</div>}
            </dl>
          ) : (
            <p className="text-slate-400">Keine Kontaktanfrage (nur Vergleich).</p>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-1">Vergleichsdaten</h3>
          <p>{req.input.energyType === 'gas' ? 'Gas' : 'Strom'} · PLZ {req.input.postalCode}{req.input.city ? ` ${req.input.city}` : ''}</p>
          <p>{req.input.annualConsumptionKwh.toLocaleString('de-DE')} kWh/Jahr</p>
          {req.input.currentProvider && <p>Bisher: {req.input.currentProvider} {req.input.currentTariff ?? ''}</p>}
          {req.input.desiredStartDate && <p>Lieferbeginn: {req.input.desiredStartDate}</p>}
          <p className="text-slate-400">Quelle: {req.comparison?.providerName} · {req.comparison && dateTime(req.comparison.fetchedAt)}</p>
        </div>
      </section>

      {sel && (
        <section className="p-3 rounded-xl border border-slate-700">
          <h3 className="font-semibold">Ausgewähltes Angebot {sel.offer.source.isDemo && <span className="text-amber-300 text-xs">DEMO</span>}</h3>
          <p>{sel.offer.providerName} – {sel.offer.tariffName}</p>
          <p className="text-slate-400">
            {sel.offer.workPriceCtPerKwh} ct/kWh · {sel.offer.basePriceEurPerMonth} €/Monat · Garantie {sel.offer.priceGuaranteeMonths} Mon. · Laufzeit {sel.offer.contractTermMonths} Mon. · Kündigung {sel.offer.noticePeriodWeeks} Wo.
          </p>
          {sel.cost && <p>Geschätzt: {eur(sel.cost.annualCostWithoutBonusEur)}/Jahr (1. Jahr mit Bonus {eur(sel.cost.firstYearCostWithBonusEur)})</p>}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold">Prüfung & Freigabe</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Notiz / Begründung / Rückfrage an den Kunden" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg" />
        {s === 'SUBMITTED' && (
          <input value={confirmationRef} onChange={(e) => setConfirmationRef(e.target.value)} placeholder="Bestätigungsreferenz des Anbieters (Pflicht für Abschluss)" className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg" />
        )}
        <div className="flex flex-wrap gap-2">
          {s === 'WAITING_FOR_ADMIN' && (
            <button disabled={busy} onClick={() => act('approve', 'Freigegeben.')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600"><CheckCircle2 className="w-4 h-4" aria-hidden /> Prüfen & freigeben</button>
          )}
          {s === 'APPROVED' && (
            <button disabled={busy} onClick={() => act('submit', 'Als eingereicht markiert.')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600"><Send className="w-4 h-4" aria-hidden /> Beim Anbieter eingereicht</button>
          )}
          {s === 'SUBMITTED' && (
            <button disabled={busy} onClick={() => act('complete', 'Als abgeschlossen markiert.')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600"><CheckCircle2 className="w-4 h-4" aria-hidden /> Anbieter hat bestätigt</button>
          )}
          {s === 'ERROR' && (
            <button disabled={busy} onClick={() => act('retry', 'Zur Prüfung zurückgesetzt.')} className="px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800">Zur Prüfung</button>
          )}
          {['WAITING_FOR_ADMIN', 'APPROVED', 'SUBMITTED', 'ERROR'].includes(s) && (
            <button disabled={busy} onClick={() => act('reject', 'Abgelehnt.')} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-800 hover:bg-rose-700"><XCircle className="w-4 h-4" aria-hidden /> Ablehnen</button>
          )}
          {req.contact && (
            <button disabled={busy} onClick={() => act('request_info', 'Rückfrage protokolliert.')} className="px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800">Nachfrage protokollieren</button>
          )}
          <button disabled={busy} onClick={() => act('note', 'Notiz gespeichert.')} className="px-3 py-2 rounded-lg border border-slate-600 hover:bg-slate-800">Notiz</button>
          {req.contact && (
            <button disabled={busy} onClick={() => run(() => api.admin.draft(id), 'Entwurf erstellt (nicht versendet).')} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-blue-600/60 text-blue-300 hover:bg-blue-900/30"><FileText className="w-4 h-4" aria-hidden /> E-Mail-Entwurf</button>
          )}
        </div>
        {msg && <p role="status" className={msg.error ? 'text-rose-400' : 'text-emerald-400'}>{msg.text}</p>}
      </section>

      {req.drafts.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-semibold">Entwürfe (werden nicht automatisch versendet)</h3>
          {req.drafts.map((d: any) => (
            <details key={d.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <summary className="cursor-pointer">{d.subject} · {d.createdBy === 'gemini' ? 'KI' : 'Vorlage'} · {dateTime(d.createdAt)}</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-300">{d.body}</pre>
              <button onClick={() => navigator.clipboard?.writeText(d.body)} className="mt-2 text-xs underline">Text kopieren</button>
            </details>
          ))}
        </section>
      )}

      <section>
        <h3 className="font-semibold mb-2">Bearbeitungshistorie</h3>
        <ol className="space-y-1.5">
          {[...req.history].reverse().map((h: any, i: number) => (
            <li key={i} className="text-xs">
              <span className="text-slate-500">{dateTime(h.at)}</span> · <span className="text-slate-300">{h.actor}</span> ·{' '}
              {h.from !== h.to ? <span className="font-mono">{h.from ?? '–'} → {h.to}</span> : <span className="italic">Notiz</span>}
              {h.note && <span className="text-slate-400"> – {h.note}</span>}
            </li>
          ))}
        </ol>
        {req.notifications.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Benachrichtigungen: {req.notifications.map((n: any) => `${n.channel}/${n.recipient}: ${n.status}`).join(', ')}
          </p>
        )}
      </section>
    </article>
  );
}

function WhatsAppInbox({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [data, setData] = useState<{ configured: boolean; conversations: WaListItem[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [conv, setConv] = useState<{ conversation: any; canReply: boolean } | null>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    api.admin.waList().then(setData).catch((err) => {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
    });
  }, [onUnauthorized]);

  useEffect(() => {
    reload();
    const t = setInterval(reload, 15_000);
    return () => clearInterval(t);
  }, [reload]);

  useEffect(() => {
    if (!selected) return;
    setMsg(null);
    api.admin.waGet(selected).then(setConv).catch((err) => setMsg({ text: err.message, error: true }));
  }, [selected, data]);

  if (!data) return <Loader2 className="w-5 h-5 animate-spin" />;
  if (!data.configured) {
    return (
      <div className="p-5 rounded-2xl border border-amber-600/50 bg-amber-900/10 text-sm space-y-2">
        <p className="font-semibold">Die WhatsApp Business Platform ist noch nicht verbunden.</p>
        <p className="text-slate-300">
          Benötigt: Meta-Business-Konto, WhatsApp-Business-Nummer und eine Meta-App. Danach auf dem Server setzen: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
          WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN. Webhook-Adresse in Meta: <code className="text-orange-300">https://IHRE-DOMAIN/api/whatsapp/webhook</code>
        </p>
      </div>
    );
  }

  const act = async (fn: () => Promise<{ conversation: any }>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setConv((c) => (c ? { ...c, conversation: r.conversation } : c));
      setMsg({ text: ok });
      reload();
    } catch (err) {
      setMsg({ text: err instanceof ApiError ? err.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6">
      <ul className="space-y-2" aria-label="WhatsApp-Unterhaltungen">
        {data.conversations.length === 0 && <li className="text-sm text-slate-400">Noch keine Nachrichten.</li>}
        {data.conversations.map((c) => (
          <li key={c.waId}>
            <button onClick={() => setSelected(c.waId)} className={`w-full text-left p-3 rounded-xl border ${selected === c.waId ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium">{c.name || `+${c.waId}`}</span>
                {c.needsHuman && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Mitarbeiter gefragt</span>}
                {c.optedOut && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-600/40 text-slate-300">abgemeldet</span>}
              </div>
              <p className="text-xs text-slate-400 truncate">{c.lastMessage}</p>
              <p className="text-[11px] text-slate-500">{dateTime(c.updatedAt)}{c.linkedRequestId ? ` · ${c.linkedRequestId}` : ''}</p>
            </button>
          </li>
        ))}
      </ul>
      {conv && selected ? (
        <article className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-sm">
          <header className="flex flex-wrap justify-between gap-2">
            <div>
              <h2 className="font-bold">{conv.conversation.name || 'Kunde'} · +{conv.conversation.waId}</h2>
              {conv.conversation.linkedRequestId && <p className="text-xs text-slate-400">Verknüpft mit Anfrage {conv.conversation.linkedRequestId}</p>}
            </div>
            <button
              disabled={busy}
              onClick={() => act(() => api.admin.waBot(selected, !conv.conversation.needsHuman), conv.conversation.needsHuman ? 'Bot antwortet wieder automatisch.' : 'Sie haben übernommen – der Bot schweigt.')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-xs"
            >
              {conv.conversation.needsHuman ? <><Bot className="w-3.5 h-3.5" aria-hidden /> An Bot zurückgeben</> : <><UserRound className="w-3.5 h-3.5" aria-hidden /> Gespräch übernehmen</>}
            </button>
          </header>
          <ol className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {conv.conversation.messages.map((m: any) => (
              <li key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${m.direction === 'out' ? 'bg-emerald-800/40' : 'bg-slate-800'}`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {m.author === 'kunde' ? 'Kunde' : m.author === 'bot' ? 'Bot' : m.author.replace('admin:', '')} · {dateTime(m.at)}
                    {m.status === 'failed' && <span className="text-rose-400"> · nicht zugestellt ({m.error})</span>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {conv.canReply && !conv.conversation.optedOut ? (
            <form onSubmit={(e) => { e.preventDefault(); act(() => api.admin.waReply(selected, text), 'Gesendet.').then(() => setText('')); }} className="flex gap-2">
              <label htmlFor="wa-reply" className="sr-only">Antwort</label>
              <input id="wa-reply" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Antwort an den Kunden" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg" />
              <button disabled={busy || !text.trim()} className="flex items-center gap-1 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"><Send className="w-4 h-4" aria-hidden /> Senden</button>
            </form>
          ) : (
            <p className="text-xs text-amber-300 flex gap-1"><MessageCircle className="w-3.5 h-3.5" aria-hidden />
              {conv.conversation.optedOut ? 'Der Kunde hat WhatsApp-Nachrichten abbestellt.' : '24-Stunden-Fenster abgelaufen – Antwort nur über eine freigegebene WhatsApp-Vorlage oder einen anderen Kanal.'}
            </p>
          )}
          {msg && <p role="status" className={msg.error ? 'text-rose-400' : 'text-emerald-400'}>{msg.text}</p>}
        </article>
      ) : (
        <p className="text-sm text-slate-400">Unterhaltung auswählen.</p>
      )}
    </div>
  );
}
