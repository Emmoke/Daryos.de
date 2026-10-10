import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, LogOut, Mail, Trash2, Upload } from 'lucide-react';
import { api, ApiError, dateTime, type CustomerAccount } from './api';

// Kundenkonto: Anmeldung per E-Mail-Link (ohne Passwort), Anfragen, Nachrichten von Daryos und Unterlagen hochladen.
export function KontoPage({ token }: { token?: string }) {
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setAccount(await api.customerMe());
    } catch (err) {
      setAccount(null);
      if (err instanceof ApiError && err.status !== 401) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (token) {
        try {
          await api.customerVerify(token);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.');
        }
        // Code sofort aus der Adresszeile entfernen
        window.history.replaceState(null, '', '#/konto');
      }
      await load();
    })();
  }, [token]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Mein Konto</h1>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" aria-label="Lädt" />
      ) : account ? (
        <Account account={account} onChange={load} onLogout={async () => { await api.customerLogout().catch(() => {}); setAccount(null); }} />
      ) : (
        <Login initialError={error} />
      )}
    </section>
  );
}

function Login({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(initialError ? { text: initialError, error: true } : null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <p className="text-slate-300 mb-6">Sehen Sie Ihre Anfragen, Nachrichten von Daryos und laden Sie Unterlagen hoch (z. B. die letzte Jahresabrechnung). Ohne Passwort: Wir senden Ihnen einen Anmeldelink an die E-Mail-Adresse Ihrer Anfrage.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          try {
            setMsg({ text: (await api.customerLogin(email)).message });
          } catch (err) {
            setMsg({ text: err instanceof ApiError ? err.message : 'Fehler.', error: true });
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <label htmlFor="konto-email" className="sr-only">E-Mail-Adresse</label>
        <input id="konto-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ihre@adresse.de"
          className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-orange-500" />
        <button disabled={busy} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Mail className="w-4 h-4" aria-hidden />} Anmeldelink senden
        </button>
      </form>
      {msg && <p role="status" className={`mt-4 ${msg.error ? 'text-rose-400' : 'text-emerald-400'}`}>{msg.text}</p>}
      <p className="mt-6 text-sm text-slate-400">Noch keine Anfrage? <a href="#/vergleich" className="text-orange-400 hover:underline">Zum Tarifvergleich</a></p>
    </>
  );
}

const size = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function Account({ account, onChange, onLogout }: { account: CustomerAccount; onChange: () => void; onLogout: () => void }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <p className="text-slate-300">Angemeldet als <strong>{account.email}</strong></p>
        <button onClick={onLogout} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><LogOut className="w-4 h-4" aria-hidden /> Abmelden</button>
      </div>
      {account.requests.length === 0 && <p className="text-slate-400">Zu dieser Adresse liegt keine Anfrage vor.</p>}
      <div className="space-y-6">
        {account.requests.map((r) => <RequestCard key={r.requestId} r={r} uploadsEnabled={account.uploadsEnabled} onChange={onChange} />)}
      </div>
    </>
  );
}

function RequestCard({ r, uploadsEnabled, onChange }: { r: CustomerAccount['requests'][number]; uploadsEnabled: boolean; onChange: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    try {
      for (const f of Array.from(files)) await api.uploadDocument(r.requestId, f);
      setMsg({ text: 'Hochgeladen. Daryos sieht die Unterlagen jetzt bei Ihrer Anfrage.' });
      onChange();
    } catch (err) {
      setMsg({ text: err instanceof ApiError ? err.message : 'Hochladen fehlgeschlagen.', error: true });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  return (
    <article className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
      <header>
        <p className="text-sm text-slate-400">Anfrage {r.requestId} · {r.energyType === 'gas' ? 'Gas' : 'Strom'} · {dateTime(r.createdAt)}</p>
        <p className="text-xl font-bold mt-1">{r.statusLabel}</p>
        {r.selectedOffer && <p className="text-slate-300 text-sm mt-1">{r.selectedOffer.tariffName} – {r.selectedOffer.providerName}{r.selectedOffer.isDemo && <span className="ml-2 text-xs font-bold text-amber-300">DEMO</span>}</p>}
        <a href={`#/status/${r.requestId}`} className="text-sm text-orange-400 hover:underline">Verlauf ansehen</a>
      </header>

      {r.messages.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Nachrichten von Daryos</h2>
          <div className="space-y-2">
            {r.messages.map((m, i) => (
              <details key={i} className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                <summary className="cursor-pointer text-sm"><span className="font-medium">{m.subject}</span> <span className="text-slate-400">· {dateTime(m.sentAt)}</span></summary>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{m.body}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-2">Unterlagen</h2>
        {r.documents.length > 0 ? (
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 mb-3">
            {r.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{d.name} <span className="text-slate-500">· {size(d.size)}</span></span>
                <a href={`/api/customer/requests/${r.requestId}/documents/${d.id}`} className="p-1 text-slate-300 hover:text-white" aria-label={`${d.name} herunterladen`}><Download className="w-4 h-4" /></a>
                {d.byCustomer && (
                  <button onClick={async () => { if (window.confirm(`„${d.name}“ löschen?`)) { await api.deleteDocument(r.requestId, d.id).catch(() => {}); onChange(); } }} className="p-1 text-slate-300 hover:text-rose-400" aria-label={`${d.name} löschen`}><Trash2 className="w-4 h-4" /></button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 mb-3">Noch keine Unterlagen. Hilfreich: letzte Jahresabrechnung (zeigt Zählernummer, Verbrauch und aktuellen Anbieter).</p>
        )}
        {uploadsEnabled && (
          <>
            <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" multiple hidden onChange={(e) => upload(e.target.files)} />
            <button onClick={() => input.current?.click()} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />} Datei hochladen
            </button>
            <p className="mt-2 text-xs text-slate-500">PDF, JPG oder PNG, höchstens 8 MB. Nur Daryos sieht Ihre Unterlagen; sie werden mit der Anfrage nach Ablauf der Aufbewahrungsfrist gelöscht.</p>
          </>
        )}
        {msg && <p role="status" className={`mt-2 text-sm ${msg.error ? 'text-rose-400' : 'text-emerald-400'}`}>{msg.text}</p>}
      </div>
    </article>
  );
}
