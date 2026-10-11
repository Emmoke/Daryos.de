import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, date } from '../api';
import { Badge, Button, Card, Empty, Field, inputCls, Notice, PageHeader, Spinner } from '../ui';

type Form = Record<string, string | boolean>;

const today = () => new Date().toISOString().slice(0, 10);
const inMonths = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};

const EMPTY: Form = {
  energyType: 'strom', providerName: '', tariffName: '', workPriceCtPerKwh: '', basePriceEurPerMonth: '', priceGuaranteeMonths: '12',
  priceGuaranteeType: '', contractTermMonths: '12', noticePeriodWeeks: '4', eco: false, bonusEur: '', bonusConditions: '', postalCodes: '',
  minKwh: '', maxKwh: '', validFrom: today(), validUntil: inMonths(1), source: '', officialUrl: '', partnerId: '', active: true,
};

const toForm = (t: any): Form => ({
  ...EMPTY,
  ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, typeof v === 'number' ? String(v).replace('.', ',') : v ?? ''])),
  postalCodes: (t.postalCodes ?? []).join(', '),
});

function status(t: any) {
  const d = today();
  if (!t.active) return <Badge>inaktiv</Badge>;
  if (t.validUntil < d) return <Badge tone="red">abgelaufen</Badge>;
  if (t.validFrom > d) return <Badge tone="blue">ab {date(t.validFrom)}</Badge>;
  return <Badge tone="green">aktiv</Badge>;
}

export function TariffsPage() {
  const [data, setData] = useState<{ tariffs: any[]; currentCount: number; source: { name: string; isDemo: boolean } } | null>(null);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const reload = useCallback(() => api.tariffs().then(setData).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true })), []);
  useEffect(() => { reload(); }, [reload]);

  return (
    <>
      <PageHeader
        title="Tarife"
        description="Ihre echten Tarifangebote (z. B. aus Maklerpool oder Anbieterportal). Aktive, gültige Tarife erscheinen im Tarifvergleich auf der Webseite."
        actions={!editing && <Button variant="primary" onClick={() => setEditing({ form: { ...EMPTY } })}><Plus className="w-3.5 h-3.5" aria-hidden /> Neuer Tarif</Button>}
      />
      {data && (
        <div className="mb-4">
          {data.source.isDemo ? (
            <Notice tone="amber">Die Webseite zeigt derzeit <strong>DEMO-Testdaten</strong>, weil noch kein aktiver, gültiger Tarif gepflegt ist. Sobald Sie einen Tarif anlegen, ersetzt er die DEMO-Daten vollständig.</Notice>
          ) : (
            <Notice tone="green">Die Webseite zeigt <strong>{data.currentCount}</strong> aktive Tarif(e) aus Ihrem Katalog. DEMO-Daten sind abgeschaltet.</Notice>
          )}
        </div>
      )}
      {msg && <div className="mb-4"><Notice tone={msg.error ? 'red' : 'green'}>{msg.text}</Notice></div>}
      {editing && (
        <TariffForm
          initial={editing.form}
          isNew={!editing.id}
          onCancel={() => setEditing(null)}
          onSave={async (f) => {
            const payload = { ...f, eco: !!f.eco, active: f.active !== false };
            const r = editing.id ? await api.updateTariff(editing.id, payload) : await api.createTariff(payload);
            setEditing(null);
            setMsg({ text: `Tarif „${r.tariff.tariffName}“ gespeichert.` });
            reload();
          }}
        />
      )}
      <Card padded={false}>
        {!data ? <Spinner /> : data.tariffs.length === 0 ? <Empty>Noch keine Tarife. Legen Sie Ihren ersten Tarif an.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Tarif</th><th className="px-3 py-2.5 font-medium">Preise (brutto)</th><th className="px-3 py-2.5 font-medium">Bedingungen</th>
                  <th className="px-3 py-2.5 font-medium">Gebiet</th><th className="px-3 py-2.5 font-medium">Gültig</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.tariffs.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium">{t.tariffName}</p>
                      <p className="text-xs text-slate-500">{t.providerName} · {t.energyType === 'gas' ? 'Gas' : 'Strom'}{t.eco ? ' · Öko' : ''}</p>
                      <p className="text-[11px] text-slate-400">Quelle: {t.source}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{String(t.workPriceCtPerKwh).replace('.', ',')} ct/kWh<br /><span className="text-slate-500">{String(t.basePriceEurPerMonth).replace('.', ',')} €/Monat</span></td>
                    <td className="px-3 py-3 text-xs text-slate-600">Garantie {t.priceGuaranteeMonths} Mon.<br />Laufzeit {t.contractTermMonths} Mon. · Kündigung {t.noticePeriodWeeks} Wo.{t.bonusEur ? <><br />Bonus {t.bonusEur} €</> : null}</td>
                    <td className="px-3 py-3 text-xs">{t.postalCodes.length ? t.postalCodes.join(', ') : 'bundesweit'}</td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">{date(t.validFrom)} –<br />{date(t.validUntil)}</td>
                    <td className="px-3 py-3">{status(t)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {t.officialUrl && <a href={t.officialUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100" title="Anbieterseite"><ExternalLink className="w-3.5 h-3.5" /></a>}
                        <Button size="sm" variant="ghost" aria-label="Bearbeiten" onClick={() => setEditing({ id: t.id, form: toForm(t) })}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" aria-label="Löschen" onClick={async () => {
                          if (!window.confirm(`Tarif „${t.tariffName}“ löschen?`)) return;
                          try { await api.deleteTariff(t.id); reload(); } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true }); }
                        }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function TariffForm({ initial, isNew, onSave, onCancel }: { initial: Form; isNew: boolean; onSave: (f: Form) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  useEffect(() => { api.partners().then((r) => setPartners(r.partners)).catch(() => {}); }, []);
  const bind = (k: string) => ({ value: String(f[k] ?? ''), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }), className: inputCls });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    try {
      await onSave(f);
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); setError(err.message); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={isNew ? 'Neuer Tarif' : 'Tarif bearbeiten'} actions={<Button size="sm" variant="ghost" onClick={onCancel}>Abbrechen</Button>} className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Sparte"><select {...bind('energyType')}><option value="strom">Strom</option><option value="gas">Gas</option></select></Field>
          <Field label="Anbieter" error={errors.providerName}><input {...bind('providerName')} placeholder="z. B. Stadtwerke Leipzig" /></Field>
          <Field label="Tarifname" error={errors.tariffName} className="lg:col-span-2"><input {...bind('tariffName')} /></Field>
          <Field label="Arbeitspreis (ct/kWh, brutto)" error={errors.workPriceCtPerKwh}><input {...bind('workPriceCtPerKwh')} inputMode="decimal" /></Field>
          <Field label="Grundpreis (€/Monat, brutto)" error={errors.basePriceEurPerMonth}><input {...bind('basePriceEurPerMonth')} inputMode="decimal" /></Field>
          <Field label="Preisgarantie (Monate)" error={errors.priceGuaranteeMonths}><input {...bind('priceGuaranteeMonths')} inputMode="numeric" /></Field>
          <Field label="Art der Preisgarantie (optional)"><input {...bind('priceGuaranteeType')} placeholder="z. B. eingeschränkt" /></Field>
          <Field label="Vertragslaufzeit (Monate)" error={errors.contractTermMonths}><input {...bind('contractTermMonths')} inputMode="numeric" /></Field>
          <Field label="Kündigungsfrist (Wochen)" error={errors.noticePeriodWeeks}><input {...bind('noticePeriodWeeks')} inputMode="numeric" /></Field>
          <Field label="Bonus in € (optional)" error={errors.bonusEur}><input {...bind('bonusEur')} inputMode="decimal" /></Field>
          <Field label="Bonusbedingungen" error={errors.bonusConditions}><input {...bind('bonusConditions')} placeholder="z. B. nach 12 Monaten Belieferung" /></Field>
          <Field label="PLZ-Gebiete (leer = bundesweit)" error={errors.postalCodes} hint="z. B. 04, 06846" className="lg:col-span-2"><input {...bind('postalCodes')} /></Field>
          <Field label="Verbrauch ab (kWh, optional)" error={errors.minKwh}><input {...bind('minKwh')} inputMode="numeric" /></Field>
          <Field label="Verbrauch bis (kWh, optional)" error={errors.maxKwh}><input {...bind('maxKwh')} inputMode="numeric" /></Field>
          <Field label="Gültig ab"><input type="date" {...bind('validFrom')} /></Field>
          <Field label="Gültig bis" error={errors.validUntil}><input type="date" {...bind('validUntil')} /></Field>
          <Field label="Quelle des Angebots" error={errors.source} hint="z. B. Maklerpool XY, Abruf 10.10.2026" className="lg:col-span-2"><input {...bind('source')} /></Field>
          <Field label="Offizielle Tarifseite (optional)" error={errors.officialUrl} className="lg:col-span-2"><input {...bind('officialUrl')} placeholder="https://…" /></Field>
          <Field label="Antrag über Partner (optional)" hint="Partner pflegen Sie unter „Partner“" className="lg:col-span-2">
            <select {...bind('partnerId')}><option value="">– kein Partner hinterlegt –</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.eco} onChange={(e) => setF({ ...f, eco: e.target.checked })} className="w-4 h-4 accent-slate-900" /> Öko-Tarif (laut Anbieter)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.active !== false} onChange={(e) => setF({ ...f, active: e.target.checked })} className="w-4 h-4 accent-slate-900" /> Auf der Webseite anzeigen</label>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">Bitte nur Preise eintragen, die Ihnen vom Anbieter bzw. Maklerpool tatsächlich vorliegen.</p>
          <div className="flex items-center gap-3">
            {error && !Object.keys(errors).length && <span className="text-sm text-rose-600">{error}</span>}
            <Button type="submit" variant="primary" loading={busy}>Speichern</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
