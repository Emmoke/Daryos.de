import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Plus, Trash2, Undo2 } from 'lucide-react';
import { api, ApiError, date, eur } from '../api';
import { downloadInvoicePdf } from '../invoicePdf';
import { Badge, Button, Card, Empty, Field, inputCls, Notice, PageHeader, Spinner, Stat } from '../ui';

type Tab = 'auswertung' | 'rechnungen' | 'buchungen';
const toCents = (v: string) => Math.round(Number(v.replace(/\./g, '').replace(',', '.')) * 100);

export function AccountingPage() {
  const [tab, setTab] = useState<Tab>('auswertung');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const years = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <>
      <PageHeader
        title="Buchhaltung"
        description="Rechnungen, Einnahmen und Ausgaben. Korrekturen erfolgen nachvollziehbar über Storno bzw. Gegenbuchung."
        actions={
          <>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={`${inputCls} w-auto`} aria-label="Geschäftsjahr">
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
            <a href={`/api/admin/accounting/export.csv?year=${year}`} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="w-3.5 h-3.5" aria-hidden /> CSV für Steuerberater
            </a>
          </>
        }
      />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
        {([['auswertung', 'Auswertung'], ['rechnungen', 'Rechnungen'], ['buchungen', 'Einnahmen & Ausgaben']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {tab === 'auswertung' && <Summary year={year} />}
      {tab === 'rechnungen' && <Invoices />}
      {tab === 'buchungen' && <Bookings year={year} />}
    </>
  );
}

function Summary({ year }: { year: string }) {
  const [s, setS] = useState<any>(null);
  useEffect(() => { setS(null); api.summary(year).then(setS).catch(() => {}); }, [year]);
  if (!s) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Einnahmen" value={eur(s.incomeCents)} />
        <Stat label="Ausgaben" value={eur(s.expenseCents)} />
        <Stat label="Ergebnis (vereinfachte EÜR)" value={eur(s.resultCents)} tone={s.resultCents < 0 ? 'red' : 'green'} />
        <Stat label="Offene Rechnungen" value={eur(s.openInvoices.totalCents)} sub={`${s.openInvoices.count} offen · ${s.openInvoices.overdue} überfällig`} tone={s.openInvoices.overdue ? 'red' : undefined} />
      </div>
      {s.smallBusiness ? (
        <Notice>Kleinunternehmerregelung (§ 19 UStG) aktiv: Rechnungen ohne Umsatzsteuer. Eine Umsatzsteuer-Voranmeldung entfällt in der Regel.</Notice>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Vereinnahmte Umsatzsteuer" value={eur(s.vatCollectedCents)} />
          <Stat label="Gezahlte Vorsteuer" value={eur(s.vatPaidCents)} sub={`Zahllast ca. ${eur(s.vatCollectedCents - s.vatPaidCents)}`} />
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Monate">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="font-medium pb-2">Monat</th><th className="font-medium pb-2 text-right">Einnahmen</th><th className="font-medium pb-2 text-right">Ausgaben</th><th className="font-medium pb-2 text-right">Ergebnis</th></tr></thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {s.months.map((m: any) => (
                <tr key={m.month}>
                  <td className="py-1.5">{new Date(2000, m.month - 1).toLocaleString('de-DE', { month: 'long' })}</td>
                  <td className="py-1.5 text-right">{eur(m.incomeCents)}</td>
                  <td className="py-1.5 text-right">{eur(m.expenseCents)}</td>
                  <td className={`py-1.5 text-right ${m.incomeCents - m.expenseCents < 0 ? 'text-rose-700' : ''}`}>{eur(m.incomeCents - m.expenseCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Ausgaben nach Kategorie">
          {s.expensesByCategory.length === 0 ? <Empty>Keine Ausgaben gebucht.</Empty> : (
            <ul className="space-y-3">
              {s.expensesByCategory.map((c: any) => (
                <li key={c.category}>
                  <div className="flex justify-between text-sm"><span>{c.category}</span><span className="tabular-nums">{eur(c.cents)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${(c.cents / s.expenseCents) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="text-xs text-slate-500">Hinweis: Die Auswertung ist eine Hilfe für die Einnahmen-Überschuss-Rechnung und ersetzt keine Steuerberatung.</p>
    </div>
  );
}

function Invoices() {
  const [list, setList] = useState<any[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const reload = useCallback(() => api.invoices().then((r) => setList(r.invoices)).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ text: ok }); reload(); } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Rechnungsnummern werden automatisch und lückenlos vergeben.</p>
        {!creating && <Button variant="primary" onClick={() => setCreating(true)}><Plus className="w-3.5 h-3.5" aria-hidden /> Neue Rechnung</Button>}
      </div>
      {creating && <InvoiceForm onDone={(created) => { setCreating(false); if (created) { setMsg({ text: `Rechnung ${created.number} erstellt.` }); reload(); } }} />}
      {msg && <Notice tone={msg.error ? 'red' : 'green'}>{msg.text}</Notice>}
      <Card padded={false}>
        {!list ? <Spinner /> : list.length === 0 ? <Empty>Noch keine Rechnungen.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr><th className="px-5 py-2.5 font-medium">Nummer</th><th className="px-3 py-2.5 font-medium">Datum</th><th className="px-3 py-2.5 font-medium">Kunde</th><th className="px-3 py-2.5 font-medium text-right">Betrag</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-5 py-2.5" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((i) => {
                  const overdue = i.kind === 'rechnung' && i.status === 'offen' && i.dueDate < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={i.id}>
                      <td className="px-5 py-3 font-mono text-xs">{i.number}{i.kind === 'storno' && <span className="ml-1.5"><Badge>Storno</Badge></span>}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{date(i.issueDate)}</td>
                      <td className="px-3 py-3">{i.customer.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{eur(i.grossCents)}</td>
                      <td className="px-3 py-3">
                        {i.kind === 'storno' ? <Badge>Storno</Badge> : i.status === 'bezahlt' ? <Badge tone="green">bezahlt {i.paidAt ? date(i.paidAt) : ''}</Badge> : i.status === 'storniert' ? <Badge>storniert</Badge> : overdue ? <Badge tone="red">überfällig</Badge> : <Badge tone="amber">offen bis {date(i.dueDate)}</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => downloadInvoicePdf(i)} title="PDF herunterladen"><FileText className="w-3.5 h-3.5" aria-hidden /> PDF</Button>
                          {i.kind === 'rechnung' && i.status === 'offen' && <Button size="sm" onClick={() => act(() => api.markPaid(i.id), `${i.number} als bezahlt gebucht.`)}>Bezahlt</Button>}
                          {i.kind === 'rechnung' && i.status !== 'storniert' && (
                            <Button size="sm" variant="danger" onClick={() => { const r = window.prompt(`Stornogrund für ${i.number}:`); if (r) act(() => api.cancelInvoice(i.id, r), `${i.number} storniert (Stornorechnung erstellt).`); }}>Stornieren</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function InvoiceForm({ onDone }: { onDone: (created?: any) => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ name: '', street: '', postalCode: '', city: '', email: '', issueDate: today, serviceDate: today, notes: '', linkedRequestId: '' });
  const [items, setItems] = useState([{ description: '', quantity: '1', price: '', vatRate: '19' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.settings().then((r) => { setSettings(r.settings); setMissing(r.missing); }).catch(() => {}); }, []);

  const total = items.reduce((s, it) => s + (Number(it.quantity.replace(',', '.')) || 0) * (toCents(it.price || '0') || 0), 0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    try {
      const r = await api.createInvoice({
        customer: { name: f.name, street: f.street, postalCode: f.postalCode, city: f.city, email: f.email },
        issueDate: f.issueDate,
        serviceDate: f.serviceDate,
        notes: f.notes,
        linkedRequestId: f.linkedRequestId,
        items: items.map((it) => ({ description: it.description, quantity: Number(it.quantity.replace(',', '.')), unitPriceCents: toCents(it.price || 'x'), vatRate: Number(it.vatRate) })),
      });
      onDone(r.invoice);
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); setError(err.message); }
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <Card><Spinner /></Card>;
  if (missing.length) return <Notice tone="amber">Bevor Sie Rechnungen schreiben können, vervollständigen Sie bitte die Firmendaten unter <a href="#/einstellungen" className="underline">Einstellungen</a>: {missing.join(', ')}. <button className="underline ml-2" onClick={() => onDone()}>Schließen</button></Notice>;

  return (
    <Card title="Neue Rechnung" actions={<Button size="sm" variant="ghost" onClick={() => onDone()}>Abbrechen</Button>}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Kunde / Firma" error={errors['customer.name']} className="sm:col-span-2"><input value={f.name} onChange={set('name')} className={inputCls} /></Field>
          <Field label="E-Mail (optional)" className="sm:col-span-2"><input type="email" value={f.email} onChange={set('email')} className={inputCls} /></Field>
          <Field label="Straße und Nr." error={errors['customer.address']} className="sm:col-span-2"><input value={f.street} onChange={set('street')} className={inputCls} /></Field>
          <Field label="PLZ"><input value={f.postalCode} onChange={set('postalCode')} className={inputCls} /></Field>
          <Field label="Ort"><input value={f.city} onChange={set('city')} className={inputCls} /></Field>
          <Field label="Rechnungsdatum"><input type="date" value={f.issueDate} onChange={set('issueDate')} className={inputCls} /></Field>
          <Field label="Leistungsdatum"><input type="date" value={f.serviceDate} onChange={set('serviceDate')} className={inputCls} /></Field>
          <Field label="Anfrage-ID (optional)" className="sm:col-span-2"><input value={f.linkedRequestId} onChange={set('linkedRequestId')} placeholder="DY-…" className={`${inputCls} font-mono`} /></Field>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-700">Positionen {settings.smallBusiness && <span className="font-normal text-slate-500">(Kleinunternehmer – ohne USt)</span>}</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <input aria-label="Beschreibung" value={it.description} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} placeholder="Leistung, z. B. Tarifberatung Strom" className={`${inputCls} col-span-12 sm:col-span-6`} />
                <input aria-label="Menge" value={it.quantity} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} className={`${inputCls} col-span-3 sm:col-span-1 text-right`} />
                <input aria-label="Einzelpreis in Euro" value={it.price} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} placeholder="0,00 €" className={`${inputCls} col-span-5 sm:col-span-2 text-right`} />
                {!settings.smallBusiness ? (
                  <select aria-label="USt-Satz" value={it.vatRate} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, vatRate: e.target.value } : x)))} className={`${inputCls} col-span-3 sm:col-span-2`}>
                    <option value="19">19 %</option><option value="7">7 %</option><option value="0">0 %</option>
                  </select>
                ) : <span className="hidden sm:block sm:col-span-2" />}
                <Button type="button" variant="ghost" className="col-span-1" aria-label="Position entfernen" disabled={items.length === 1} onClick={() => setItems((s) => s.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></Button>
                {(errors[`items.${i}.description`] || errors[`items.${i}.unitPrice`] || errors[`items.${i}.quantity`]) && <p className="col-span-12 text-[11px] text-rose-600">{errors[`items.${i}.description`] || errors[`items.${i}.unitPrice`] || errors[`items.${i}.quantity`]}</p>}
              </div>
            ))}
          </div>
          <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => setItems((s) => [...s, { description: '', quantity: '1', price: '', vatRate: '19' }])}><Plus className="w-3.5 h-3.5" aria-hidden /> Position</Button>
          {errors.items && <p className="text-[11px] text-rose-600">{errors.items}</p>}
        </div>

        <Field label="Hinweis auf der Rechnung (optional)"><textarea value={f.notes} onChange={set('notes')} rows={2} className={`${inputCls} h-auto py-2`} /></Field>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm">Summe {settings.smallBusiness ? '' : 'netto'}: <strong className="tabular-nums">{eur(Math.round(total))}</strong></p>
          {error && !Object.keys(errors).length && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" variant="primary" loading={busy}>Rechnung erstellen</Button>
        </div>
        <p className="text-[11px] text-slate-500">Nach dem Erstellen ist die Rechnung unveränderbar. Fehler werden über „Stornieren“ korrigiert.</p>
      </form>
    </Card>
  );
}

function Bookings({ year }: { year: string }) {
  const [data, setData] = useState<{ bookings: any[]; categories: { einnahme: string[]; ausgabe: string[] } } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ type: 'ausgabe', date: today, category: '', description: '', amount: '', vatRate: '0', receiptNo: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(() => api.bookings(year).then(setData).catch(() => {}), [year]);
  useEffect(() => { reload(); }, [reload]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === 'type' ? { category: '' } : {}) }));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      await api.addBooking({ type: f.type, date: f.date, category: f.category, description: f.description, grossCents: toCents(f.amount || 'x'), vatRate: Number(f.vatRate), receiptNo: f.receiptNo });
      setF((s) => ({ ...s, description: '', amount: '', receiptNo: '' }));
      setMsg({ text: 'Gebucht.' });
      reload();
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); setMsg({ text: err.message, error: true }); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Neue Buchung">
        <form onSubmit={add} className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Field label="Art"><select value={f.type} onChange={set('type')} className={inputCls}><option value="ausgabe">Ausgabe</option><option value="einnahme">Einnahme</option></select></Field>
          <Field label="Datum" error={errors.date}><input type="date" value={f.date} max={today} onChange={set('date')} className={inputCls} /></Field>
          <Field label="Kategorie" error={errors.category}>
            <select value={f.category} onChange={set('category')} className={inputCls}>
              <option value="">Bitte wählen</option>
              {(data?.categories[f.type as 'einnahme' | 'ausgabe'] ?? []).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Beschreibung" error={errors.description} className="lg:col-span-2"><input value={f.description} onChange={set('description')} placeholder="z. B. Druckerpapier" className={inputCls} /></Field>
          <Field label="Betrag brutto (€)" error={errors.grossCents}><input value={f.amount} onChange={set('amount')} inputMode="decimal" placeholder="0,00" className={`${inputCls} text-right`} /></Field>
          <Field label="USt-Satz"><select value={f.vatRate} onChange={set('vatRate')} className={inputCls}><option value="0">0 %</option><option value="7">7 %</option><option value="19">19 %</option></select></Field>
          <Field label="Beleg-Nr. (optional)"><input value={f.receiptNo} onChange={set('receiptNo')} className={inputCls} /></Field>
          <div className="lg:col-span-4 flex items-center justify-end gap-3">
            {msg && <span className={`text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</span>}
            <Button type="submit" variant="primary" loading={busy}>Buchen</Button>
          </div>
        </form>
      </Card>
      <Card padded={false}>
        {!data ? <Spinner /> : data.bookings.length === 0 ? <Empty>Keine Buchungen in {year}.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr><th className="px-5 py-2.5 font-medium">Datum</th><th className="px-3 py-2.5 font-medium">Art</th><th className="px-3 py-2.5 font-medium">Kategorie</th><th className="px-3 py-2.5 font-medium">Beschreibung</th><th className="px-3 py-2.5 font-medium text-right">Brutto</th><th className="px-5 py-2.5" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.bookings.map((b) => (
                  <tr key={b.id} className={b.reversedByBookingId ? 'text-slate-400' : ''}>
                    <td className="px-5 py-2.5 whitespace-nowrap">{date(b.date)}</td>
                    <td className="px-3 py-2.5">{b.type === 'einnahme' ? <Badge tone="green">Einnahme</Badge> : <Badge>Ausgabe</Badge>}</td>
                    <td className="px-3 py-2.5">{b.category}</td>
                    <td className="px-3 py-2.5">{b.description}{b.receiptNo && <span className="text-xs text-slate-400"> · Beleg {b.receiptNo}</span>}{b.reversedByBookingId && <span className="ml-1.5"><Badge>storniert</Badge></span>}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${b.grossCents < 0 ? 'text-rose-700' : ''}`}>{eur(b.grossCents)}</td>
                    <td className="px-5 py-2.5 text-right">
                      {!b.invoiceId && !b.reversedByBookingId && !b.reversesBookingId && (
                        <Button size="sm" variant="ghost" title="Gegenbuchung erstellen" onClick={async () => { if (window.confirm('Gegenbuchung erstellen? Die ursprüngliche Buchung bleibt sichtbar.')) { try { await api.reverseBooking(b.id); reload(); } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true }); } } }}>
                          <Undo2 className="w-3.5 h-3.5" aria-hidden /> Stornieren
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
