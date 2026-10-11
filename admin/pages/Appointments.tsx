import React, { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Check, Phone, X } from 'lucide-react';
import { api, ApiError } from '../api';
import { Badge, Button, Card, Empty, Field, inputCls, Notice, PageHeader, Spinner } from '../ui';

type Data = Awaited<ReturnType<typeof api.appointments>>;
const TONE: Record<string, 'amber' | 'green' | 'gray' | 'blue'> = { angefragt: 'amber', bestaetigt: 'green', abgesagt: 'gray', erledigt: 'blue' };
const today = () => new Date().toISOString().slice(0, 10);
const when = (d?: { date: string; time: string }) => (d ? `${new Date(`${d.date}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} · ${d.time} Uhr` : '–');

export function AppointmentsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const reload = useCallback(() => api.appointments().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);
  if (error) return <Notice tone="red">{error}</Notice>;
  if (!data) return <Spinner />;
  const asked = data.appointments.filter((a) => a.status === 'angefragt');
  const upcoming = data.appointments.filter((a) => a.status === 'bestaetigt' && a.confirmed.date >= today());
  const past = data.appointments.filter((a) => (a.status === 'bestaetigt' && a.confirmed.date < today()) || a.status === 'abgesagt' || a.status === 'erledigt').reverse();

  return (
    <>
      <PageHeader title="Termine" description="Terminanfragen von der Webseite bestätigen, eigene Termine anlegen, Kunden automatisch informieren."
        actions={!creating && <Button variant="primary" onClick={() => setCreating(true)}><CalendarPlus className="w-3.5 h-3.5" aria-hidden /> Termin anlegen</Button>} />
      {!data.emailConfigured && <div className="mb-4"><Notice tone="amber">E-Mail ist nicht verbunden – Kunden werden nicht automatisch informiert. Rufen Sie zur Bestätigung an oder verbinden Sie E-Mail unter Einstellungen → Verbindungen.</Notice></div>}
      {creating && <NewAppointment data={data} onDone={() => { setCreating(false); reload(); }} onCancel={() => setCreating(false)} />}
      <div className="space-y-6">
        <Card title={`Warten auf Bestätigung (${asked.length})`}>
          {asked.length ? <div className="space-y-4">{asked.map((a) => <Row key={a.id} a={a} data={data} onChanged={reload} />)}</div> : <Empty>Keine offenen Terminanfragen.</Empty>}
        </Card>
        <Card title={`Kommende Termine (${upcoming.length})`}>
          {upcoming.length ? <div className="space-y-4">{upcoming.map((a) => <Row key={a.id} a={a} data={data} onChanged={reload} />)}</div> : <Empty>Keine bestätigten Termine.</Empty>}
        </Card>
        {past.length > 0 && (
          <Card title="Vergangen / abgeschlossen">
            <div className="space-y-4">{past.slice(0, 30).map((a) => <Row key={a.id} a={a} data={data} onChanged={reload} />)}</div>
          </Card>
        )}
      </div>
    </>
  );
}

function Row({ a, data, onChanged }: { a: any; data: Data; onChanged: () => void }) {
  const [mode, setMode] = useState<'' | 'confirm' | 'cancel'>('');
  const [f, setF] = useState({ date: a.confirmed?.date ?? a.wish?.date ?? today(), time: a.confirmed?.time ?? a.wish?.time ?? '10:00', durationMin: String(a.confirmed?.durationMin ?? 45), location: a.confirmed?.location ?? '', note: '', notify: !!a.email });
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<{ emailed: boolean }>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ text: ok + (f.notify && a.email ? (r.emailed ? ' Kunde per E-Mail informiert.' : ' E-Mail konnte nicht gesendet werden – bitte anrufen.') : '') });
      setMode('');
      setTimeout(onChanged, 1200);
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };
  const isPast = a.status === 'bestaetigt' && a.confirmed?.date < today();
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{a.name} <span className="font-mono text-xs text-slate-500">{a.id}</span></p>
          <p className="text-sm text-slate-600">{data.services[a.service]} · {data.formats[a.format]}{a.requestId && <> · <a className="text-indigo-600 hover:underline font-mono" href={`#/anfragen/${a.requestId}`}>{a.requestId}</a></>}</p>
          <p className="text-sm mt-1">{a.status === 'angefragt' ? <>Wunschtermin: <strong>{when(a.wish)}</strong></> : <><strong>{when(a.confirmed)}</strong>{a.confirmed?.location && <span className="text-slate-600"> · {a.confirmed.location}</span>}</>}</p>
          <p className="text-sm text-slate-600 mt-1 flex flex-wrap gap-x-4"><a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="w-3.5 h-3.5" /> {a.phone}</a>{a.email && <a href={`mailto:${a.email}`} className="hover:underline">{a.email}</a>}</p>
          {a.notes && <p className="text-sm text-slate-600 mt-1">Notiz: {a.notes}</p>}
        </div>
        <Badge tone={TONE[a.status]}>{isPast ? 'vorbei' : data.statusLabels[a.status]}</Badge>
      </div>
      {(a.status === 'angefragt' || a.status === 'bestaetigt') && !mode && (
        <div className="mt-3 flex flex-wrap gap-2">
          {a.status === 'angefragt' && <Button size="sm" variant="primary" onClick={() => setMode('confirm')}><Check className="w-3.5 h-3.5" /> Bestätigen / anderen Termin</Button>}
          {a.status === 'bestaetigt' && !isPast && <Button size="sm" onClick={() => setMode('confirm')}>Verschieben</Button>}
          {isPast && <Button size="sm" variant="primary" loading={busy} onClick={() => run(() => api.appointmentStatus(a.id, { status: 'erledigt' }), 'Als erledigt markiert.')}>Erledigt</Button>}
          <Button size="sm" onClick={() => setMode('cancel')}><X className="w-3.5 h-3.5" /> Absagen</Button>
        </div>
      )}
      {mode === 'confirm' && (
        <div className="mt-3 grid sm:grid-cols-4 gap-3 rounded-lg bg-slate-50 p-3">
          <Field label="Datum"><input type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Uhrzeit"><input type="time" className={inputCls} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label="Dauer (Min.)"><input inputMode="numeric" className={inputCls} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} /></Field>
          <Field label="Ort / Link (optional)"><input className={inputCls} value={f.location} placeholder="automatisch je Beratungsart" onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
          <Field label="Hinweis an den Kunden (optional)" className="sm:col-span-4"><input className={inputCls} value={f.note} placeholder="z. B. Bitte letzte Jahresabrechnung mitbringen" onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <label className="sm:col-span-4 flex items-center gap-2 text-sm"><input type="checkbox" disabled={!a.email} checked={f.notify} onChange={(e) => setF({ ...f, notify: e.target.checked })} className="w-4 h-4 accent-slate-900" /> Kunden per E-Mail informieren {!a.email && '(keine E-Mail angegeben – bitte anrufen)'}</label>
          <div className="sm:col-span-4 flex gap-2">
            <Button size="sm" variant="primary" loading={busy} onClick={() => run(() => api.confirmAppointment(a.id, { ...f, durationMin: Number(f.durationMin) }), a.wish && (a.wish.date !== f.date || a.wish.time !== f.time) ? 'Neuer Termin vorgeschlagen.' : 'Termin bestätigt.')}>Speichern</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('')}>Abbrechen</Button>
          </div>
        </div>
      )}
      {mode === 'cancel' && (
        <div className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3">
          <Field label="Grund / Nachricht (optional)"><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!a.email} checked={f.notify} onChange={(e) => setF({ ...f, notify: e.target.checked })} className="w-4 h-4 accent-slate-900" /> Kunden per E-Mail informieren</label>
          <div className="flex gap-2">
            <Button size="sm" loading={busy} onClick={() => run(() => api.appointmentStatus(a.id, { status: 'abgesagt', note: f.note, notify: f.notify }), 'Termin abgesagt.')}>Absagen</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('')}>Zurück</Button>
          </div>
        </div>
      )}
      {msg && <p role="status" className={`mt-2 text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
    </div>
  );
}

export function NewAppointment({ data, onDone, onCancel, preset }: { data: Data; onDone: () => void; onCancel: () => void; preset?: { name?: string; phone?: string; email?: string; service?: string; requestId?: string } }) {
  const [f, setF] = useState({ name: preset?.name ?? '', phone: preset?.phone ?? '', email: preset?.email ?? '', service: preset?.service ?? 'all', format: 'vor-ort', date: today(), time: '10:00', durationMin: '45', location: '', note: '', notes: '', notify: !!preset?.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const bind = (k: keyof typeof f) => ({ value: String(f[k]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }), className: inputCls });
  return (
    <Card title="Termin anlegen" actions={<Button size="sm" variant="ghost" onClick={onCancel}>Abbrechen</Button>} className="mb-6">
      <form className="grid sm:grid-cols-3 gap-3" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try { await api.createAppointment({ ...f, durationMin: Number(f.durationMin), requestId: preset?.requestId }); onDone(); }
        catch (err) { if (err instanceof ApiError) setErrors({ ...err.fields, _: err.message }); }
        finally { setBusy(false); }
      }}>
        <Field label="Name" error={errors.name}><input {...bind('name')} /></Field>
        <Field label="Telefon" error={errors.phone}><input {...bind('phone')} /></Field>
        <Field label="E-Mail (optional)" error={errors.email}><input {...bind('email')} /></Field>
        <Field label="Thema"><select {...bind('service')}>{Object.entries(data.services).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Beratungsart"><select {...bind('format')}>{Object.entries(data.formats).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Ort / Link (optional)"><input {...bind('location')} placeholder="automatisch je Beratungsart" /></Field>
        <Field label="Datum" error={errors.date}><input type="date" {...bind('date')} /></Field>
        <Field label="Uhrzeit" error={errors.time}><input type="time" {...bind('time')} /></Field>
        <Field label="Dauer (Min.)" error={errors.durationMin}><input {...bind('durationMin')} inputMode="numeric" /></Field>
        <Field label="Hinweis an den Kunden (optional)" className="sm:col-span-3"><input {...bind('note')} placeholder="z. B. Bitte letzte Jahresabrechnung mitbringen" /></Field>
        <label className="sm:col-span-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.notify} disabled={!f.email} onChange={(e) => setF({ ...f, notify: e.target.checked })} className="w-4 h-4 accent-slate-900" /> Bestätigung per E-Mail an den Kunden (mit Kalender-Link)</label>
        <div className="sm:col-span-3 flex items-center justify-end gap-3">
          {errors._ && <span className="text-sm text-rose-600">{errors._}</span>}
          <Button type="submit" variant="primary" loading={busy}>Termin speichern</Button>
        </div>
      </form>
    </Card>
  );
}
