import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { REQUEST_STATUSES, STATUS_LABELS, type RankedOffer, type RequestStatus } from '../../shared/platform';
import { api, ApiError, dateTime, eur } from '../api';
import { Badge, Button, Card, Empty, inputCls, Notice, PageHeader, Spinner } from '../ui';

const TONE: Partial<Record<RequestStatus, 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet'>> = {
  WAITING_FOR_ADMIN: 'amber',
  APPROVED: 'blue',
  SUBMITTED: 'violet',
  COMPLETED: 'green',
  ERROR: 'red',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={TONE[status] ?? 'gray'}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export function RequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | ''>('WAITING_FOR_ADMIN');
  const [list, setList] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setError('');
    api.requests(filter || undefined).then((r) => setList(r.requests)).catch((e) => setError(e instanceof ApiError ? e.message : 'Fehler'));
  }, [filter]);
  useEffect(reload, [reload]);

  return (
    <>
      <PageHeader
        title="Anfragen"
        description="Vergleiche und Kontaktanfragen von der Webseite. Verbindliche Schritte nur nach Ihrer Prüfung."
        actions={
          <>
            <select value={filter} onChange={(e) => setFilter(e.target.value as RequestStatus | '')} className={`${inputCls} w-auto`} aria-label="Status filtern">
              <option value="">Alle Status</option>
              {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <Button onClick={reload}><RefreshCw className="w-3.5 h-3.5" aria-hidden /> Aktualisieren</Button>
          </>
        }
      />
      {error && <Notice tone="red">{error}</Notice>}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6 items-start">
        <Card padded={false}>
          {!list ? <Spinner /> : list.length === 0 ? <Empty>Keine Anfragen in diesem Status.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {list.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setSelected(r.id)} className={`w-full text-left px-5 py-3.5 transition-colors ${selected === r.id ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium truncate">{r.customerName ?? 'Nur Vergleich'}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{r.id}</span> · {r.energyType === 'gas' ? 'Gas' : 'Strom'} · {r.postalCode} · {dateTime(r.updatedAt)}
                      {r.isDemo && <span className="ml-1.5"><Badge tone="amber">Demo</Badge></span>}
                    </p>
                    {r.selectedOffer && <p className="mt-0.5 text-xs text-slate-600 truncate">{r.selectedOffer}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {selected ? <RequestDetail id={selected} onChanged={reload} /> : <Card><Empty>Wählen Sie eine Anfrage aus.</Empty></Card>}
      </div>
    </>
  );
}

function RequestDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [req, setReq] = useState<any>(null);
  const [note, setNote] = useState('');
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReq(null);
    setMsg(null);
    api.request(id).then((r) => setReq(r.request)).catch((e) => setMsg({ text: e.message, error: true }));
  }, [id]);

  const run = async (fn: () => Promise<{ request: any }>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setReq((await fn()).request);
      setNote('');
      setMsg({ text: ok });
      onChanged();
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };
  const act = (action: string, ok: string) => run(() => api.requestAction(id, { action, note: note || undefined, providerConfirmationRef: ref || undefined }), ok);

  if (!req) return <Card>{msg ? <Notice tone="red">{msg.text}</Notice> : <Spinner />}</Card>;
  const sel: RankedOffer | undefined = req.comparison?.offers.find((o: RankedOffer) => o.offer.id === req.selectedOfferId);
  const s: RequestStatus = req.status;

  return (
    <div className="space-y-4">
      <Card title={<span className="font-mono">{req.id}</span>} actions={<StatusBadge status={s} />}>
        <div className="grid sm:grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Kunde</p>
            {req.contact ? (
              <div className="space-y-0.5">
                <p className="font-medium">{req.contact.name}</p>
                <p><a className="text-indigo-600 hover:underline" href={`mailto:${req.contact.email}`}>{req.contact.email}</a></p>
                {req.contact.phone && <p>{req.contact.phone}</p>}
                <p className="text-xs text-slate-500">Kontaktweg: {req.contact.preferredChannel} · Einwilligung {dateTime(req.contact.consentAt)}</p>
              </div>
            ) : <p className="text-slate-500">Keine Kontaktanfrage – nur Vergleich.</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Vergleich</p>
            <p>{req.input.energyType === 'gas' ? 'Gas' : 'Strom'} · PLZ {req.input.postalCode} {req.input.city ?? ''}</p>
            <p>{req.input.annualConsumptionKwh.toLocaleString('de-DE')} kWh/Jahr</p>
            {req.input.currentProvider && <p>Bisher: {req.input.currentProvider} {req.input.currentTariff ?? ''}</p>}
            {req.input.desiredStartDate && <p>Lieferbeginn: {req.input.desiredStartDate}</p>}
            <p className="text-xs text-slate-500 mt-1">Quelle: {req.comparison?.providerName}</p>
          </div>
        </div>
        {req.contact?.message && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm whitespace-pre-line">„{req.contact.message}“</p>}
      </Card>

      {sel && (
        <Card title="Ausgewähltes Angebot" actions={sel.offer.source.isDemo ? <Badge tone="amber">Demo – nicht buchbar</Badge> : undefined}>
          <p className="text-sm font-medium">{sel.offer.providerName} – {sel.offer.tariffName}</p>
          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Arbeitspreis</dt><dd>{sel.offer.workPriceCtPerKwh} ct/kWh</dd></div>
            <div><dt className="text-xs text-slate-500">Grundpreis</dt><dd>{sel.offer.basePriceEurPerMonth} €/Monat</dd></div>
            <div><dt className="text-xs text-slate-500">Garantie / Laufzeit</dt><dd>{sel.offer.priceGuaranteeMonths} / {sel.offer.contractTermMonths} Mon.</dd></div>
            <div><dt className="text-xs text-slate-500">Jahreskosten (geschätzt)</dt><dd className="font-medium">{sel.cost ? eur(Math.round(sel.cost.annualCostWithoutBonusEur * 100)) : '–'}</dd></div>
          </dl>
        </Card>
      )}

      {req.summary && (
        <Card title={`Vorbereitung (${req.summary.generatedBy === 'gemini' ? 'KI' : 'regelbasiert'})`}>
          <p className="text-sm text-slate-700 whitespace-pre-line">{req.summary.text}</p>
          {req.summary.warnings.map((w: string) => (
            <p key={w} className="mt-2 flex gap-2 text-sm text-amber-800"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />{w}</p>
          ))}
          {req.summary.missingInformation.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500">Noch benötigt</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700 space-y-0.5">{req.summary.missingInformation.map((m: string) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
        </Card>
      )}

      <Card title="Prüfung und Freigabe">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Notiz, Begründung oder Rückfrage" className={`${inputCls} h-auto py-2`} />
        {s === 'SUBMITTED' && <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Bestätigungsnummer des Anbieters (Pflicht für Abschluss)" className={`${inputCls} mt-2`} />}
        <div className="mt-3 flex flex-wrap gap-2">
          {s === 'WAITING_FOR_ADMIN' && <Button variant="primary" loading={busy} onClick={() => act('approve', 'Freigegeben.')}>Prüfen und freigeben</Button>}
          {s === 'APPROVED' && <Button variant="primary" loading={busy} onClick={() => act('submit', 'Als eingereicht markiert.')}>Beim Anbieter eingereicht</Button>}
          {s === 'SUBMITTED' && <Button variant="primary" loading={busy} onClick={() => act('complete', 'Abgeschlossen.')}>Anbieter hat bestätigt</Button>}
          {s === 'ERROR' && <Button loading={busy} onClick={() => act('retry', 'Zur Prüfung zurückgesetzt.')}>Erneut prüfen</Button>}
          {['WAITING_FOR_ADMIN', 'APPROVED', 'SUBMITTED', 'ERROR'].includes(s) && <Button variant="danger" disabled={busy} onClick={() => act('reject', 'Abgelehnt.')}>Ablehnen</Button>}
          {req.contact && <Button disabled={busy} onClick={() => act('request_info', 'Rückfrage protokolliert.')}>Rückfrage protokollieren</Button>}
          <Button variant="ghost" disabled={busy} onClick={() => act('note', 'Notiz gespeichert.')}>Notiz speichern</Button>
        </div>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
      </Card>

      {req.contact && <OfferEmail req={req} onUpdated={(r) => { setReq(r); onChanged(); }} />}
      <Documents req={req} onUpdated={(r) => setReq(r)} />

      <Card title="Verlauf">
        <ol className="space-y-2">
          {[...req.history].reverse().map((h: any, i: number) => (
            <li key={i} className="text-xs text-slate-600">
              <span className="text-slate-400">{dateTime(h.at)}</span> · <span className="font-medium text-slate-700">{h.actor}</span> ·{' '}
              {h.from !== h.to ? <>{STATUS_LABELS[h.to as RequestStatus]}</> : <em>Notiz</em>}
              {h.note && <span className="text-slate-500"> – {h.note}</span>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

/** Angebot für den Kunden vorbereiten (Vorlage bzw. KI), prüfen, bearbeiten und nach Freigabe senden. */
function Documents({ req, onUpdated }: { req: any; onUpdated: (r: any) => void }) {
  const docs: any[] = req.documents ?? [];
  const remove = async (d: any) => {
    if (!window.confirm(`„${d.name}“ endgültig löschen?`)) return;
    try { onUpdated((await api.deleteDocument(req.id, d.id)).request); } catch (e) { window.alert((e as Error).message); }
  };
  return (
    <Card title={`Unterlagen des Kunden (${docs.length})`}>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">Noch keine Unterlagen. Kunden laden sie unter „Mein Konto“ auf der Webseite hoch (Anmeldung per E-Mail-Link).</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <span className="flex-1 truncate">{d.name} <span className="text-slate-400">· {Math.max(1, Math.round(d.size / 1024))} KB · {new Date(d.uploadedAt).toLocaleString('de-DE')}</span></span>
              <a className="text-indigo-600 hover:underline" href={`/api/admin/requests/${encodeURIComponent(req.id)}/documents/${d.id}`}>Herunterladen</a>
              <button className="text-rose-600 hover:underline" onClick={() => remove(d)}>Löschen</button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">Nur PDF/JPG/PNG (Inhalt geprüft). Dateien liegen in einem privaten Speicher und werden mit der Anfrage nach Ablauf der Frist gelöscht.</p>
    </Card>
  );
}

function OfferEmail({ req, onUpdated }: { req: any; onUpdated: (r: any) => void }) {
  const offers: RankedOffer[] = (req.comparison?.offers ?? []).filter((o: RankedOffer) => o.complete);
  const [offerId, setOfferId] = useState<string>(req.selectedOfferId ?? offers[0]?.offer.id ?? '');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const drafts = [...req.drafts].reverse();

  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      onUpdated((await api.requestDraft(req.id, offerId || undefined)).request);
      setMsg({ text: 'Entwurf erstellt. Bitte prüfen und bei Bedarf anpassen.' });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Angebot an den Kunden" actions={<span className="text-xs text-slate-500">Versand nur nach Ihrer Freigabe</span>}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-medium text-slate-700 flex-1 min-w-[220px]">
          Angebot auswählen
          <select value={offerId} onChange={(e) => setOfferId(e.target.value)} className={`${inputCls} mt-1`}>
            {offers.map((o) => (
              <option key={o.offer.id} value={o.offer.id}>
                {o.offer.source.isDemo ? '[DEMO] ' : ''}{o.offer.providerName} – {o.offer.tariffName}{o.cost ? ` · ${eur(Math.round(o.cost.annualCostWithoutBonusEur * 100))}/Jahr` : ''}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" loading={busy} disabled={!offers.length} onClick={create}>Entwurf erstellen</Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Der Entwurf übernimmt Preise und Bedingungen direkt aus dem Angebot. Ist der KI-Assistent eingerichtet, formuliert er den Text – Zahlen werden dabei automatisch auf Veränderungen geprüft.</p>
      {msg && <p role="status" className={`mt-2 text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
      <div className="mt-4 space-y-3">
        {drafts.map((d: any) => <DraftEditor key={d.id} req={req} draft={d} onUpdated={onUpdated} />)}
      </div>
    </Card>
  );
}

function DraftEditor({ req, draft, onUpdated }: { req: any; draft: any; onUpdated: (r: any) => void }) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = subject !== draft.subject || body !== draft.body;

  const act = async (fn: () => Promise<{ request: any }>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      onUpdated((await fn()).request);
      setMsg({ text: ok });
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };

  if (draft.sentAt) {
    return (
      <details className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2">
        <summary className="cursor-pointer text-sm"><Badge tone="green">gesendet</Badge> <span className="ml-1">{draft.subject}</span> <span className="text-xs text-slate-500">· an {draft.sentTo} · {dateTime(draft.sentAt)}</span></summary>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-700">{draft.body}</pre>
      </details>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge tone="amber">Entwurf</Badge> {draft.createdBy === 'gemini' ? 'von der KI formuliert' : 'aus Vorlage'} · {dateTime(draft.createdAt)}
        {draft.offerIsDemo && <Badge tone="red">enthält DEMO-Angebot – Versand gesperrt</Badge>}
      </div>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Betreff" className={inputCls} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Text" rows={14} className={`${inputCls} h-auto py-2 font-mono text-[13px]`} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!dirty || busy} onClick={() => act(() => api.saveDraft(req.id, draft.id, subject, body), 'Gespeichert.')}>Änderungen speichern</Button>
        <Button
          size="sm"
          variant="primary"
          disabled={busy || dirty || draft.offerIsDemo}
          title={dirty ? 'Bitte zuerst speichern' : undefined}
          onClick={() => {
            if (window.confirm(`Diese E-Mail jetzt an ${req.contact.email} senden?\n\nBetreff: ${draft.subject}`)) act(() => api.sendDraft(req.id, draft.id), 'E-Mail gesendet.');
          }}
        >
          Geprüft – an Kunden senden
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(`${subject}\n\n${body}`)}>Text kopieren</Button>
      </div>
      {msg && <p role="status" className={`text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
    </div>
  );
}
