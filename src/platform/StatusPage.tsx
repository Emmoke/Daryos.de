import React, { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { PublicRequestStatus } from '../../shared/platform';
import { api, ApiError, dateTime } from './api';

export function StatusPage({ initialId }: { initialId?: string }) {
  const [id, setId] = useState(initialId ?? '');
  const [status, setStatus] = useState<PublicRequestStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (value: string) => {
    setLoading(true);
    setError('');
    setStatus(null);
    try {
      setStatus(await api.status(value.trim().toUpperCase()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fehler beim Abruf.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) load(initialId);
  }, [initialId]);

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Status Ihrer Anfrage</h1>
      <p className="text-slate-300 mb-6">Geben Sie Ihre Anfrage-ID ein (Format DY-XXXX-XXXX-XXXX).</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.location.hash = `#/status/${id.trim().toUpperCase()}`;
          load(id);
        }}
        className="flex gap-2 mb-8"
      >
        <label htmlFor="req-id" className="sr-only">Anfrage-ID</label>
        <input
          id="req-id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="DY-…"
          className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg font-mono uppercase focus:outline-none focus:border-orange-500"
        />
        <button className="flex items-center gap-2 px-5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Search className="w-4 h-4" aria-hidden />} Abrufen
        </button>
      </form>
      {error && <p role="alert" className="text-rose-400">{error}</p>}
      {status && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <p className="text-sm text-slate-400">Anfrage {status.requestId} · {status.energyType === 'gas' ? 'Gas' : 'Strom'}</p>
            <p className="text-2xl font-bold mt-1">{status.statusLabel}</p>
            {status.selectedOffer && (
              <p className="text-slate-300 mt-1">
                Angefragt: {status.selectedOffer.tariffName} – {status.selectedOffer.providerName}
                {status.selectedOffer.isDemo && <span className="ml-2 text-xs font-bold text-amber-300">DEMO</span>}
              </p>
            )}
          </div>
          {status.status !== 'COMPLETED' && (
            <p className="text-sm text-slate-400">
              Hinweis: Ein Vertrag gilt erst als abgeschlossen, wenn der Anbieter ihn bestätigt hat. Dieser Status wird dann hier angezeigt.
            </p>
          )}
          <ol className="border-l border-slate-700 pl-4 space-y-3">
            {status.history.map((h, i) => (
              <li key={i}>
                <p className="font-medium">{h.statusLabel}</p>
                <p className="text-xs text-slate-400">{dateTime(h.at)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
