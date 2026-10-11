import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { api, ApiError, type Connections } from '../api';
import { Badge, Button, Card, Field, inputCls, Notice, PageHeader, Spinner } from '../ui';

type Tab = 'firma' | 'verbindungen' | 'sicherheit';

export function SettingsPage({ twoFactor, onTwoFactorChange }: { twoFactor: boolean; onTwoFactorChange: (on: boolean) => void }) {
  const [tab, setTab] = useState<Tab>('verbindungen');
  return (
    <>
      <PageHeader title="Einstellungen" description="Verbindungen (Schlüssel für Chat, E-Mail, WhatsApp), Firmendaten für Rechnungen und Sicherheit." />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
        {([['verbindungen', 'Verbindungen'], ['firma', 'Firmendaten'], ['sicherheit', 'Sicherheit']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {tab === 'firma' && <BusinessForm />}
      {tab === 'verbindungen' && <Connections />}
      {tab === 'sicherheit' && <Security twoFactor={twoFactor} onTwoFactorChange={onTwoFactorChange} />}
    </>
  );
}

function BusinessForm() {
  const [s, setS] = useState<any>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.settings().then((r) => { setS(r.settings); setMissing(r.missing); }).catch(() => {}); }, []);
  if (!s) return <Spinner />;
  const bind = (k: string) => ({ value: s[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value }), className: inputCls });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      const r = await api.saveSettings({ ...s, paymentTermDays: Number(s.paymentTermDays) });
      setS(r.settings);
      setMissing(r.missing);
      setMsg({ text: 'Gespeichert.' });
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fields); setMsg({ text: err.message, error: true }); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      {missing.length > 0 && <Notice tone="amber">Für Rechnungen noch erforderlich: {missing.join(', ')}.</Notice>}
      <Card title="Unternehmen">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Firmenname" className="sm:col-span-2"><input {...bind('businessName')} /></Field>
          <Field label="Inhaber/in"><input {...bind('ownerName')} /></Field>
          <Field label="Telefon"><input {...bind('phone')} /></Field>
          <Field label="Straße und Nr." className="sm:col-span-2"><input {...bind('street')} /></Field>
          <Field label="PLZ" error={errors.postalCode}><input {...bind('postalCode')} /></Field>
          <Field label="Ort"><input {...bind('city')} /></Field>
          <Field label="E-Mail" error={errors.email} className="sm:col-span-2"><input type="email" {...bind('email')} /></Field>
        </div>
      </Card>
      <Card title="Steuern">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Steuernummer" hint="vom Finanzamt"><input {...bind('taxNumber')} /></Field>
          <Field label="USt-IdNr. (optional)"><input {...bind('vatId')} /></Field>
          <label className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={!!s.smallBusiness} onChange={(e) => setS({ ...s, smallBusiness: e.target.checked })} className="mt-0.5 w-4 h-4 accent-slate-900" />
            <span className="text-sm">
              <span className="font-medium">Kleinunternehmerregelung (§ 19 UStG)</span>
              <span className="block text-xs text-slate-500">Rechnungen ohne Umsatzsteuer mit dem gesetzlichen Hinweis. Gilt für neue Rechnungen; bestehende bleiben unverändert.</span>
            </span>
          </label>
        </div>
      </Card>
      <Card title="Bank und Rechnungen">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Bank"><input {...bind('bankName')} /></Field>
          <Field label="BIC"><input {...bind('bic')} /></Field>
          <Field label="IBAN" className="sm:col-span-2"><input {...bind('iban')} /></Field>
          <Field label="Rechnungs-Präfix" error={errors.invoicePrefix} hint="z. B. RE → RE-2026-0001"><input {...bind('invoicePrefix')} /></Field>
          <Field label="Zahlungsziel (Tage)"><input type="number" min={0} max={90} {...bind('paymentTermDays')} /></Field>
        </div>
      </Card>
      <div className="flex items-center justify-end gap-3">
        {msg && <span className={`text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</span>}
        <Button type="submit" variant="primary" loading={busy}>Speichern</Button>
      </div>
    </form>
  );
}

function Step({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm text-slate-700">
      {done ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden /> : <Circle className="w-4 h-4 mt-0.5 shrink-0 text-slate-300" aria-hidden />}
      <span>{children}</span>
    </li>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] font-mono text-slate-800">{children}</code>;

const GROUP_INFO: Record<'gemini' | 'email' | 'whatsapp', { title: string; intro: React.ReactNode; note?: string }> = {
  gemini: {
    title: 'Chat-Assistent (Google Gemini)',
    intro: <>Schlüssel unter <a className="text-indigo-600 hover:underline inline-flex items-center gap-0.5" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey <ExternalLink className="w-3 h-3" aria-hidden /></a> erstellen (Projekt daryos-cd99a), kopieren und hier einfügen.</>,
    note: 'Der Assistent erfindet keine Preise und gibt keine Zusagen. Ton, Wissen und Werkzeuge passen Sie unter „KI-Assistent“ an.',
  },
  email: {
    title: 'E-Mail (Benachrichtigung und Angebots-E-Mails)',
    intro: <>Empfehlung: <a className="text-indigo-600 hover:underline" href="https://www.brevo.com" target="_blank" rel="noopener noreferrer">Brevo</a> (kostenlos, EU). Dort Absender bestätigen → „SMTP &amp; API“ → SMTP-Schlüssel erzeugen. Outlook.com/Hotmail erlauben den Versand aus Programmen meist nicht.</>,
    note: 'Benachrichtigungen enthalten nur die Anfrage-ID und einen Link – keine Kundendaten. „Testen“ schickt eine Test-E-Mail an „Benachrichtigung an“.',
  },
  whatsapp: {
    title: 'WhatsApp',
    intro: <>Für den Chat-Knopf reicht die Nummer. Für den automatischen Bot zusätzlich die vier Angaben aus der <a className="text-indigo-600 hover:underline" href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">Meta-App (WhatsApp Business Platform)</a>.</>,
  },
};

function Connections() {
  const [c, setC] = useState<Connections | null>(null);
  const [i, setI] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.connections().then(setC).catch((e) => setError(e.message));
    api.integrations().then(setI).catch(() => {});
  }, []);
  if (error) return <Notice tone="red">{error}</Notice>;
  if (!c) return <Spinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      <Notice tone="blue">
        Zugangsdaten hier eintragen und mit Ihrem <strong>Verwaltungs-Passwort</strong> bestätigen. Sie werden verschlüsselt auf dem Server gespeichert, sofort aktiv (ohne Neustart) und nie wieder im Klartext angezeigt.
      </Notice>
      {!c.writable && (
        <Notice tone="amber">Speichern ist noch nicht freigeschaltet: Auf dem Server fehlt der Verschlüsselungsschlüssel. Einmal in der Cloud Shell <Code>cd ~/Daryos.de && git pull && bash scripts/cloudrun-deploy.sh</Code> ausführen – danach funktioniert es.</Notice>
      )}

      {(['gemini', 'email', 'whatsapp'] as const).map((g) => (
        <ConnectionForm key={g} group={g} data={c} onSaved={setC} />
      ))}
      {c.status.whatsapp.mode === 'business_api' && (
        <Card title="WhatsApp-Bot: Webhook in Meta eintragen">
          <ol className="space-y-2">
            <Step>Meta → WhatsApp → Konfiguration → Webhook-URL: <Code>{c.webhookUrl}</Code></Step>
            <Step>Dasselbe Verify-Token wie oben eintragen und das Feld <Code>messages</Code> abonnieren.</Step>
          </ol>
        </Card>
      )}

      <Card title="Datenbank (Cloud Firestore)" actions={i?.storage?.configured ? <Badge tone="green">verbunden</Badge> : <Badge>nicht verbunden</Badge>}>
        <p className="text-sm text-slate-700">Aktuell: <strong>{i?.storage?.detail ?? '…'}</strong>. Wird beim Veröffentlichen mit <Code>scripts/cloudrun-deploy.sh</Code> automatisch eingerichtet.</p>
      </Card>
      <Card title="Angebotsquelle für den Tarifvergleich" actions={i?.offerProvider?.isDemo ? <Badge tone="amber">Demo</Badge> : <Badge tone="green">Katalog</Badge>}>
        <p className="text-sm text-slate-700">Aktuell: <strong>{i?.offerProvider?.name ?? '…'}</strong>. Ihre Vertragspartner (Anbieter, Maklerpool) mit Portal-Link pflegen Sie unter <a href="#/partner" className="text-indigo-600 hover:underline">Partner</a>, deren Tarife unter <a href="#/tarife" className="text-indigo-600 hover:underline">Tarife</a>. Anträge bereiten Sie bei jeder Anfrage vor (selbst, vom Kunden oder per KI aus der Rechnung) und reichen sie im Partnerportal ein. Eine direkte Schnittstelle (API) eines Partners kann nach Vertrag und API-Dokumentation ergänzt werden.</p>
      </Card>
    </div>
  );
}

function ConnectionForm({ group, data, onSaved }: { group: 'gemini' | 'email' | 'whatsapp'; data: Connections; onSaved: (c: Connections) => void }) {
  const adminEmail = data.adminEmail ?? '';
  const fields = data.groups[group];
  const st = data.status[group];
  const info = GROUP_INFO[group];
  const initial = () => Object.fromEntries(fields.map((f) => [f.key, f.secret ? '' : f.source === 'verwaltung' ? f.display : '']));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState<'' | 'save' | 'test' | 'clear'>('');
  const stored = fields.filter((f) => f.source === 'verwaltung').map((f) => f.key);
  const changed = fields.some((f) => (values[f.key] ?? '') !== (initial()[f.key] ?? ''));

  const submit = async (clear: string[] = []) => {
    setBusy(clear.length ? 'clear' : 'save');
    setErrors({});
    setMsg(null);
    try {
      const r = await api.saveConnection(group, values, clear, password);
      onSaved(r);
      setPassword('');
      setValues(Object.fromEntries(r.groups[group].map((f) => [f.key, f.secret ? '' : f.source === 'verwaltung' ? f.display : ''])));
      setMsg({ text: clear.length ? 'Entfernt.' : r.status[group].configured ? 'Gespeichert und aktiv. Jetzt „Testen“.' : 'Gespeichert – es fehlen noch Pflichtangaben.' });
    } catch (e) {
      if (e instanceof ApiError) { setErrors(e.fields); setMsg({ text: e.message, error: true }); }
    } finally {
      setBusy('');
    }
  };
  const test = async () => {
    setBusy('test');
    setMsg(null);
    try {
      setMsg({ text: (await api.testConnection(group)).message });
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setBusy('');
    }
  };

  return (
    <Card title={info.title} actions={st.configured ? <Badge tone="green">verbunden</Badge> : <Badge>nicht verbunden</Badge>}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
        <p className="text-sm text-slate-700">{info.intro}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? ' *' : '')} error={errors[f.key]} hint={f.source === 'server' ? `Auf dem Server hinterlegt${f.display ? `: ${f.display}` : ''} – ein Eintrag hier hat Vorrang.` : f.hint} className={f.secret || f.key === 'MAIL_FROM' ? 'sm:col-span-2' : ''}>
              <input
                type="text"
                name={`daryos-${f.key.toLowerCase()}`}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                spellCheck={false}
                className={`${inputCls} ${f.secret ? 'secret-input' : ''}`}
                value={values[f.key] ?? ''}
                placeholder={f.secret && f.source ? `${f.display} (gespeichert – leer lassen = unverändert)` : f.placeholder}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <input type="text" name="username" autoComplete="username" value={adminEmail} readOnly hidden aria-hidden />
          <Field label="Verwaltungs-Passwort zur Bestätigung" error={errors.password} className="grow min-w-[220px]">
            <input type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" loading={busy === 'save'} disabled={!data.writable || !password || !changed}>Speichern</Button>
          <Button type="button" onClick={test} loading={busy === 'test'} disabled={!st.configured}>Testen</Button>
          {stored.length > 0 && (
            <Button type="button" loading={busy === 'clear'} disabled={!password} onClick={() => window.confirm('In der Verwaltung gespeicherte Angaben dieser Verbindung entfernen?') && submit(stored)}>Entfernen</Button>
          )}
        </div>
        {msg && <p role="status" className={`text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
        {info.note && <p className="text-xs text-slate-500">{info.note}</p>}
      </form>
    </Card>
  );
}

function Security({ twoFactor, onTwoFactorChange }: { twoFactor: boolean; onTwoFactorChange: (on: boolean) => void }) {
  const [source, setSource] = useState<'verwaltung' | 'server' | null>(null);
  const [writable, setWritable] = useState(true);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; otpauth: string } | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.connections().then((c) => { setSource(c.twoFactor.source); setWritable(c.writable); }).catch(() => {}); }, [twoFactor]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try { await fn(); } catch (e) { setMsg({ text: (e as Error).message, error: true }); } finally { setBusy(false); }
  };
  const start = () => run(async () => { setSetup(await api.totpSetup(password)); setPassword(''); setCode(''); });
  const enable = () => run(async () => { await api.totpEnable(code); setSetup(null); setCode(''); onTwoFactorChange(true); setMsg({ text: 'Zwei-Faktor-Anmeldung ist aktiv. Ab der nächsten Anmeldung: Passwort + Code.' }); });
  const disable = () => run(async () => { const r = await api.totpDisable(password, code); setPassword(''); setCode(''); onTwoFactorChange(r.twoFactor); setMsg({ text: 'Zwei-Faktor-Anmeldung wurde ausgeschaltet.' }); });
  const grouped = (s: string) => s.match(/.{1,4}/g)?.join(' ') ?? s;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Zwei-Faktor-Anmeldung" actions={twoFactor ? <Badge tone="green">aktiv</Badge> : <Badge tone="amber">nicht aktiv</Badge>}>
        {!twoFactor && !setup && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Empfohlen: Mit Zwei-Faktor-Anmeldung reicht ein gestohlenes Passwort nicht aus. Sie brauchen eine Authenticator-App auf dem Handy (Google oder Microsoft Authenticator).</p>
            {!writable && <Notice tone="amber">Erst nach einmaligem <Code>bash scripts/cloudrun-deploy.sh</Code> möglich (Verschlüsselungsschlüssel fehlt).</Notice>}
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Verwaltungs-Passwort" className="grow min-w-[220px]"><input type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              <Button variant="primary" onClick={start} loading={busy} disabled={!password || !writable}>Einrichtung starten</Button>
            </div>
          </div>
        )}
        {!twoFactor && setup && (
          <div className="space-y-3">
            <ol className="space-y-2">
              <Step>Authenticator-App öffnen → „+“ → <strong>„Einrichtungsschlüssel eingeben“</strong> (bzw. „Schlüssel manuell eingeben“).</Step>
              <Step>Kontoname: <Code>Daryos</Code> · Schlüssel: <span className="font-mono text-sm font-semibold tracking-wider select-all">{grouped(setup.secret)}</span> · Typ: zeitbasiert.</Step>
              <Step>Am Handy geht es auch per Link: <a className="text-indigo-600 hover:underline" href={setup.otpauth}>In Authenticator-App öffnen</a></Step>
              <Step>Den 6-stelligen Code aus der App hier eingeben (gilt 10 Minuten).</Step>
            </ol>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Code aus der App" className="w-40"><input inputMode="numeric" maxLength={6} className={inputCls} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
              <Button variant="primary" onClick={enable} loading={busy} disabled={code.length !== 6}>Bestätigen und aktivieren</Button>
              <Button onClick={() => setSetup(null)}>Abbrechen</Button>
            </div>
          </div>
        )}
        {twoFactor && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Für die Anmeldung werden Passwort und ein Code aus Ihrer Authenticator-App benötigt.</p>
            {source === 'verwaltung' ? (
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Passwort" className="grow min-w-[180px]"><input type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                <Field label="Aktueller Code" className="w-36"><input inputMode="numeric" maxLength={6} className={inputCls} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
                <Button onClick={disable} loading={busy} disabled={!password || code.length !== 6}>Ausschalten</Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Auf dem Server eingerichtet. Entfernen nur in der Cloud Shell: <Code>gcloud run services update daryos --region europe-west3 --remove-secrets ADMIN_TOTP_SECRET</Code></p>
            )}
            <p className="text-xs text-slate-500">Handy verloren? In der Cloud Shell hilft der Notfall-Befehl in <Code>docs/ANLEITUNG.md</Code>.</p>
          </div>
        )}
        {msg && <p role="status" className={`mt-3 text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
      </Card>
      <Card title="Passwort ändern">
        <p className="text-sm text-slate-700">In der Cloud Shell: <Code>cd ~/Daryos.de && bash scripts/cloudrun-deploy.sh</Code> erzeugt bei Bedarf ein neues Passwort. Alle bestehenden Sitzungen enden dabei.</p>
      </Card>
      <Card title="Schutzmaßnahmen">
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Die Verwaltung ist eine eigene App unter <Code>/verwaltung</Code> und nicht Teil der öffentlichen Webseite.</li>
          <li>Zugangsdaten werden AES-256-verschlüsselt gespeichert, nur mit Passwort-Bestätigung geändert und nie im Klartext angezeigt.</li>
          <li>Sitzung als HttpOnly-Cookie, nach 8 Stunden abgelaufen; Anmeldeversuche auf 5 pro 15 Minuten begrenzt.</li>
          <li>Suchmaschinen werden ausgeschlossen (noindex).</li>
          <li>Rechnungen und Buchungen werden nie gelöscht, nur storniert bzw. gegengebucht.</li>
        </ul>
      </Card>
    </div>
  );
}
