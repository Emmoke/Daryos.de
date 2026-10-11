import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../api';
import { Badge, Button, Card, Empty, Field, inputCls, Notice, PageHeader, Spinner } from '../ui';

const KINDS: Record<string, string> = { direkt: 'Direkt beim Anbieter', maklerpool: 'Maklerpool', portal: 'Vergleichs-/Partnerportal' };
const EMPTY = { name: '', kind: 'maklerpool', energyTypes: ['strom', 'gas'], portalUrl: '', customerLink: '', partnerNumber: '', contractSince: '', commissionNote: '', contact: '', requirements: '', notes: '', active: true };

export function PartnersPage() {
  const [partners, setPartners] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; form: any } | null>(null);
  const [msg, setMsg] = useState('');
  const reload = useCallback(() => api.partners().then((r) => setPartners(r.partners)).catch((e) => setMsg(e.message)), []);
  useEffect(() => { reload(); }, [reload]);

  return (
    <>
      <PageHeader
        title="Partner"
        description="Anbieter und Maklerpools, mit denen Sie einen Vermittlungsvertrag haben – und wo Sie die Anträge einreichen."
        actions={!editing && <Button variant="primary" onClick={() => setEditing({ form: { ...EMPTY } })}><Plus className="w-3.5 h-3.5" aria-hidden /> Neuer Partner</Button>}
      />
      <div className="mb-4">
        <Notice tone="blue">
          So arbeitet es: <strong>1.</strong> Partner hier eintragen (Portal-Link, Partnernummer). <strong>2.</strong> Tarife des Partners unter „Tarife“ pflegen und dem Partner zuordnen.
          <strong> 3.</strong> Bei einer Anfrage den Antrag vorbereiten (selbst, vom Kunden in „Mein Konto“ oder per KI aus der Rechnung) – automatisch geprüft.
          <strong> 4.</strong> Im Partnerportal einreichen (Felder per Klick kopieren) und die Vorgangsnummer eintragen. Einen automatischen Vertragsabschluss gibt es bewusst nicht.
        </Notice>
      </div>
      {msg && <div className="mb-4"><Notice tone="red">{msg}</Notice></div>}
      {editing && (
        <PartnerForm
          initial={editing.form}
          isNew={!editing.id}
          onCancel={() => setEditing(null)}
          onSave={async (f) => {
            if (editing.id) await api.updatePartner(editing.id, f);
            else await api.createPartner(f);
            setEditing(null);
            reload();
          }}
        />
      )}
      {!partners ? <Spinner /> : partners.length === 0 ? (
        <Card><Empty>Noch keine Partner. Tragen Sie Ihren Maklerpool oder Anbieter ein, sobald der Vermittlungsvertrag besteht.</Empty></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {partners.map((p) => (
            <Card key={p.id} title={<span className="flex items-center gap-2">{p.name} {p.active ? <Badge tone="green">aktiv</Badge> : <Badge>inaktiv</Badge>}</span>}
              actions={<div className="flex gap-1">
                <a href={p.portalUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100" title="Portal öffnen"><ExternalLink className="w-3.5 h-3.5" /></a>
                <button className="p-2 rounded-lg hover:bg-slate-100" title="Bearbeiten" onClick={() => setEditing({ id: p.id, form: { ...EMPTY, ...p } })}><Pencil className="w-3.5 h-3.5" /></button>
                <button className="p-2 rounded-lg hover:bg-slate-100 text-rose-600" title="Löschen" onClick={async () => { if (window.confirm(`Partner „${p.name}“ löschen?`)) { await api.deletePartner(p.id).catch(() => {}); reload(); } }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>}>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-slate-500">Art</dt><dd>{KINDS[p.kind]} · {p.energyTypes.map((e: string) => (e === 'gas' ? 'Gas' : 'Strom')).join(', ')}</dd>
                {p.partnerNumber && <><dt className="text-slate-500">Partnernr.</dt><dd className="font-mono">{p.partnerNumber}</dd></>}
                {p.contractSince && <><dt className="text-slate-500">Vertrag seit</dt><dd>{new Date(p.contractSince).toLocaleDateString('de-DE')}</dd></>}
                {p.commissionNote && <><dt className="text-slate-500">Provision</dt><dd>{p.commissionNote}</dd></>}
                {p.contact && <><dt className="text-slate-500">Kontakt</dt><dd>{p.contact}</dd></>}
                {p.requirements && <><dt className="text-slate-500">Verlangt</dt><dd>{p.requirements}</dd></>}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PartnerForm({ initial, isNew, onSave, onCancel }: { initial: any; isNew: boolean; onSave: (f: any) => Promise<void>; onCancel: () => void }) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const bind = (k: string) => ({ value: f[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }), className: inputCls });
  const toggle = (e: string) => setF({ ...f, energyTypes: f.energyTypes.includes(e) ? f.energyTypes.filter((x: string) => x !== e) : [...f.energyTypes, e] });
  return (
    <Card title={isNew ? 'Neuer Partner' : 'Partner bearbeiten'} actions={<Button size="sm" variant="ghost" onClick={onCancel}>Abbrechen</Button>} className="mb-6">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        try { await onSave(f); } catch (err) { if (err instanceof ApiError) setErrors({ ...err.fields, _: err.message }); } finally { setBusy(false); }
      }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" error={errors.name}><input {...bind('name')} placeholder="z. B. Maklerpool XY / Stadtwerke Z" /></Field>
          <Field label="Art" error={errors.kind}><select {...bind('kind')}>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Portal-Link für Anträge" error={errors.portalUrl} className="sm:col-span-2"><input {...bind('portalUrl')} placeholder="https://partnerportal…" /></Field>
          <Field label="Partner-/Vermittlernummer"><input {...bind('partnerNumber')} /></Field>
          <Field label="Vertrag seit" error={errors.contractSince}><input type="date" {...bind('contractSince')} /></Field>
          <Field label="Provision (Notiz)"><input {...bind('commissionNote')} placeholder="z. B. 40 € je Strom-Abschluss" /></Field>
          <Field label="Ansprechpartner"><input {...bind('contact')} /></Field>
          <Field label="Kunden-Link (optional)" error={errors.customerLink} hint="Partnerlink; {plz} und {kwh} werden ersetzt" className="sm:col-span-2"><input {...bind('customerLink')} placeholder="https://…?plz={plz}&verbrauch={kwh}" /></Field>
          <Field label="Zusätzlich verlangte Angaben" className="sm:col-span-2"><textarea rows={2} {...bind('requirements')} placeholder="z. B. Zählerstand bei Umzug, Vorversorger-Kundennummer" /></Field>
          <Field label="Notizen" className="sm:col-span-2"><textarea rows={2} {...bind('notes')} /></Field>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          {['strom', 'gas'].map((e) => <label key={e} className="flex items-center gap-2"><input type="checkbox" checked={f.energyTypes.includes(e)} onChange={() => toggle(e)} className="w-4 h-4 accent-slate-900" /> {e === 'gas' ? 'Gas' : 'Strom'}</label>)}
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.active !== false} onChange={(e) => setF({ ...f, active: e.target.checked })} className="w-4 h-4 accent-slate-900" /> aktiv</label>
          {errors.energyTypes && <span className="text-rose-600">{errors.energyTypes}</span>}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          {errors._ && <span className="text-sm text-rose-600">{errors._}</span>}
          <Button type="submit" variant="primary" loading={busy}>Speichern</Button>
        </div>
      </form>
    </Card>
  );
}
