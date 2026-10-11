import React, { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';
import { api, ApiError } from '../api';
import { Badge, Button, Card, inputCls, Notice } from '../ui';

type Field = { key: string; label: string; group: string; required?: boolean; type?: string; options?: Record<string, string>; placeholder?: string };

// Antrag vorbereiten: Daten sammeln (selbst, vom Kunden, per KI aus Unterlagen), prüfen, im Partnerportal einreichen
export function ApplicationCard({ req, onUpdated }: { req: any; onUpdated: (r: any) => void }) {
  const [meta, setMeta] = useState<{ fields: Field[]; statusLabels: Record<string, string> } | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const app = req.application;
  const [fields, setFields] = useState<Record<string, string>>(app?.fields ?? {});
  const [partnerId, setPartnerId] = useState<string>(app?.partnerId ?? '');
  const [suggestions, setSuggestions] = useState<{ source: string; values: Record<string, string>; accept: Record<string, boolean> } | null>(null);
  const [portalRef, setPortalRef] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.applicationFields().then(setMeta).catch(() => {});
    api.partners().then((r) => setPartners(r.partners.filter((p: any) => p.active))).catch(() => {});
  }, []);
  useEffect(() => { setFields(req.application?.fields ?? {}); setPartnerId(req.application?.partnerId ?? ''); }, [req.id, req.application?.updatedAt]);

  const groups = useMemo(() => {
    const g: Record<string, Field[]> = {};
    for (const f of meta?.fields ?? []) (g[f.group] ??= []).push(f);
    return g;
  }, [meta]);
  const partner = partners.find((p) => p.id === partnerId);
  const locked = app?.status === 'eingereicht';
  const checkFor = (k: string) => app?.checks?.find((c: any) => c.field === k);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true }); } finally { setBusy(''); }
  };
  const save = () => run('save', async () => { onUpdated((await api.saveApplication(req.id, partnerId || undefined, fields)).request); setMsg({ text: 'Gespeichert und geprüft.' }); });
  const suggest = (source: string, values: Record<string, string>) => {
    if (!Object.keys(values).length) return setMsg({ text: 'Keine verwertbaren Angaben gefunden.', error: true });
    setSuggestions({ source, values, accept: Object.fromEntries(Object.keys(values).map((k) => [k, !fields[k]])) });
  };
  const copy = async (k: string, v: string) => { try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(''), 1200); } catch { /* egal */ } };

  if (!req.contact) return null;
  return (
    <Card title="Antrag vorbereiten" actions={app ? <Badge tone={app.status === 'vollstaendig' ? 'green' : app.status === 'eingereicht' ? 'violet' : app.status === 'daten_angefordert' ? 'blue' : 'amber'}>{meta?.statusLabels[app.status] ?? app.status}</Badge> : <Badge>neu</Badge>}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm grow min-w-[220px]">
            <span className="block mb-1 font-medium text-slate-700">Partner (wo eingereicht wird)</span>
            <select className={inputCls} value={partnerId} disabled={locked} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">– Partner wählen –</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          {partner && <a href={partner.portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"><ExternalLink className="w-3.5 h-3.5" /> Partnerportal öffnen</a>}
          {!partners.length && <a href="#/partner" className="text-sm text-indigo-600 hover:underline">Partner anlegen</a>}
        </div>
        {partner?.requirements && <p className="text-xs text-slate-600">Dieser Partner verlangt zusätzlich: {partner.requirements}{partner.partnerNumber ? ` · Ihre Partnernr.: ${partner.partnerNumber}` : ''}</p>}

        {!locked && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy === 'prefill'} onClick={() => run('prefill', async () => suggest('der Anfrage', (await api.prefillApplication(req.id)).suggestions))}>Aus Anfrage übernehmen</Button>
            {(req.documents ?? []).map((d: any) => (
              <Button key={d.id} size="sm" loading={busy === d.id} onClick={() => run(d.id, async () => suggest(`„${d.name}“ (KI)`, (await api.extractApplication(req.id, d.id)).suggestions))}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden /> KI liest „{d.name.slice(0, 24)}“
              </Button>
            ))}
            <Button size="sm" loading={busy === 'ask'} onClick={() => window.confirm('Kunden per E-Mail bitten, die Antragsdaten in „Mein Konto“ zu ergänzen?') && run('ask', async () => { onUpdated((await api.requestApplicationData(req.id)).request); setMsg({ text: 'E-Mail gesendet. Der Kunde kann die Daten jetzt in „Mein Konto“ ergänzen.' }); })}>Kunden um Daten bitten</Button>
          </div>
        )}

        {suggestions && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-sm">
            <p className="font-medium mb-2">Vorschläge aus {suggestions.source} – bitte prüfen und auswählen:</p>
            <ul className="space-y-1">
              {Object.entries(suggestions.values).map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 accent-slate-900" checked={!!suggestions.accept[k]} onChange={(e) => setSuggestions({ ...suggestions, accept: { ...suggestions.accept, [k]: e.target.checked } })} />
                  <span className="w-48 text-slate-500">{meta?.fields.find((f) => f.key === k)?.label ?? k}</span>
                  <span className="font-medium">{v}</span>
                  {fields[k] && fields[k] !== v && <span className="text-xs text-amber-700">(bisher: {fields[k]})</span>}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="primary" onClick={() => { const add = Object.fromEntries(Object.entries(suggestions.values).filter(([k]) => suggestions.accept[k])); setFields({ ...fields, ...add }); setSuggestions(null); setMsg({ text: 'Übernommen – bitte noch speichern.' }); }}>Ausgewählte übernehmen</Button>
              <Button size="sm" variant="ghost" onClick={() => setSuggestions(null)}>Verwerfen</Button>
            </div>
          </div>
        )}

        {Object.entries(groups).map(([g, list]) => (
          <fieldset key={g}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g}</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              {list.map((f) => {
                const chk = checkFor(f.key);
                const v = fields[f.key] ?? '';
                return (
                  <label key={f.key} className="text-sm">
                    <span className="mb-1 flex items-center gap-1 font-medium text-slate-700">{f.label}{f.required && ' *'}
                      {v && <button type="button" onClick={() => copy(f.key, f.options?.[v] ?? v)} className="ml-auto text-slate-400 hover:text-slate-800" title="Kopieren">{copied === f.key ? <span className="text-xs text-emerald-600">kopiert</span> : <Copy className="w-3.5 h-3.5" />}</button>}
                    </span>
                    {f.type === 'select' ? (
                      <select className={inputCls} disabled={locked} value={v} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}>
                        <option value="">–</option>{Object.entries(f.options ?? {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    ) : (
                      <input className={inputCls} disabled={locked} type={f.type === 'date' ? 'date' : 'text'} value={v} placeholder={f.placeholder} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
                    )}
                    {chk && <span className={`mt-0.5 block text-xs ${chk.level === 'fehler' ? 'text-rose-600' : 'text-amber-700'}`}>{chk.message}</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {app?.checks?.filter((c: any) => !c.field).map((c: any, i: number) => <Notice key={i} tone={c.level === 'fehler' ? 'red' : 'amber'}>{c.message}</Notice>)}
        <p className="text-xs text-slate-500">Bankdaten werden hier bewusst nicht gespeichert – der Kunde gibt sie direkt beim Anbieter bzw. im Portal an.</p>

        {!locked ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="primary" loading={busy === 'save'} onClick={save}>Speichern & prüfen</Button>
            {app?.status === 'vollstaendig' && (
              <>
                <label className="text-sm grow min-w-[200px]">
                  <span className="block mb-1 font-medium text-slate-700">Vorgangsnummer aus dem Partnerportal</span>
                  <input className={inputCls} value={portalRef} onChange={(e) => setPortalRef(e.target.value)} placeholder="nach dem Einreichen" />
                </label>
                <Button loading={busy === 'submit'} disabled={!portalRef.trim()} onClick={() => run('submit', async () => { onUpdated((await api.applicationSubmitted(req.id, portalRef)).request); setMsg({ text: 'Als eingereicht vermerkt. Tipp: oben in „Prüfung und Freigabe“ den Status „Beim Anbieter eingereicht“ setzen.' }); })}>Als eingereicht vermerken</Button>
              </>
            )}
          </div>
        ) : (
          <Notice tone="green">Eingereicht am {new Date(app.submittedAt).toLocaleString('de-DE')} · Vorgang {app.portalRef}</Notice>
        )}
        {msg && <p role="status" className={`text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
      </div>
    </Card>
  );
}
