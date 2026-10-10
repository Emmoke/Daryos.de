import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { api, ApiError } from '../api';
import { Badge, Button, Card, Field, inputCls, Notice, PageHeader, Spinner } from '../ui';

type Tab = 'firma' | 'verbindungen' | 'sicherheit';

export function SettingsPage({ twoFactor }: { twoFactor: boolean }) {
  const [tab, setTab] = useState<Tab>('verbindungen');
  return (
    <>
      <PageHeader title="Einstellungen" description="Firmendaten für Rechnungen, Verbindungen zu Chat, WhatsApp und E-Mail sowie Sicherheit." />
      <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
        {([['verbindungen', 'Verbindungen'], ['firma', 'Firmendaten'], ['sicherheit', 'Sicherheit']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
        ))}
      </div>
      {tab === 'firma' && <BusinessForm />}
      {tab === 'verbindungen' && <Connections />}
      {tab === 'sicherheit' && <Security twoFactor={twoFactor} />}
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

function Connections() {
  const [i, setI] = useState<Record<string, any> | null>(null);
  useEffect(() => { api.integrations().then(setI).catch(() => {}); }, []);
  if (!i) return <Spinner />;
  const origin = window.location.origin;
  const chatOn = i.assistant?.configured;
  const waBot = i.whatsapp?.mode === 'business_api';
  const status = (on: boolean, demo?: boolean) => (on && !demo ? <Badge tone="green">verbunden</Badge> : demo ? <Badge tone="amber">Demo</Badge> : <Badge>nicht verbunden</Badge>);

  return (
    <div className="space-y-6 max-w-3xl">
      <Notice tone="blue">
        Zugangsdaten werden nie hier im Browser eingegeben, sondern als <strong>Secrets</strong> auf dem Server hinterlegt (Google AI Studio → Secrets bzw. Cloud Run → Variablen &amp; Secrets).
        Danach den Server neu starten bzw. neu bereitstellen.
      </Notice>

      <Card title="Datenbank (Cloud Firestore)" actions={status(i.storage?.configured)}>
        <p className="mb-3 text-sm text-slate-700">Aktuell: <strong>{i.storage?.detail ?? 'unbekannt'}</strong>. Ohne Firestore gehen Daten auf Cloud Run bei jedem Neustart verloren.</p>
        <ol className="space-y-2">
          <Step done={i.storage?.configured}>Unter <a className="text-indigo-600 hover:underline" href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a> ein Projekt anlegen (oder das Google-Cloud-Projekt von Cloud Run auswählen).</Step>
          <Step done={i.storage?.configured}>„Firestore Database“ → „Datenbank erstellen“ → Standort <Code>europe-west3 (Frankfurt)</Code> → Produktionsmodus.</Step>
          <Step done={i.storage?.configured}>Dem Cloud-Run-Dienstkonto die Rolle <Code>Cloud Datastore User</Code> geben (bei Cloud Run im selben Projekt meist schon vorhanden).</Step>
          <Step done={i.storage?.configured}>Secrets/Variablen setzen: <Code>STORAGE=firestore</Code> und <Code>FIREBASE_PROJECT_ID</Code> (Projekt-ID). Dienst mit <Code>--max-instances=1</Code> betreiben.</Step>
        </ol>
        <p className="mt-3 text-xs text-slate-500">Der Browser greift nie direkt auf die Datenbank zu – nur der Server. Die Firestore-Sicherheitsregeln können daher alles für Browser sperren.</p>
      </Card>

      <Card title="Chat-Assistent auf der Webseite (Gemini)" actions={status(chatOn)}>
        <ol className="space-y-2">
          <Step done={chatOn}>API-Schlüssel erstellen: <a className="text-indigo-600 hover:underline inline-flex items-center gap-0.5" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey <ExternalLink className="w-3 h-3" aria-hidden /></a></Step>
          <Step done={chatOn}>Als Secret <Code>GEMINI_API_KEY</Code> hinterlegen (in AI Studio meist automatisch vorhanden).</Step>
          <Step done={chatOn}>Server neu starten – die Sprechblase auf der Webseite beantwortet dann Fragen aus Ihren Leistungen und FAQ.</Step>
        </ol>
        <p className="mt-3 text-xs text-slate-500">Der Assistent nennt keine Preise oder Tarife und gibt keine Zusagen. Inhalte ändern Sie über Leistungen/FAQ der Webseite.</p>
      </Card>

      <Card title="WhatsApp-Bot (WhatsApp Business Platform)" actions={status(waBot)}>
        <ol className="space-y-2">
          <Step done={waBot}>Meta-Business-Konto anlegen: <a className="text-indigo-600 hover:underline" href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">business.facebook.com</a></Step>
          <Step done={waBot}>Unter <a className="text-indigo-600 hover:underline" href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a> eine App vom Typ „Business“ erstellen und das Produkt „WhatsApp“ hinzufügen.</Step>
          <Step done={waBot}>Geschäftliche Telefonnummer hinzufügen und verifizieren (darf nicht gleichzeitig in der normalen WhatsApp-App genutzt werden).</Step>
          <Step done={waBot}>Einen System-Benutzer mit dauerhaftem Zugriffstoken (Berechtigung <Code>whatsapp_business_messaging</Code>) erstellen.</Step>
          <Step done={waBot}>Secrets hinterlegen: <Code>WHATSAPP_ACCESS_TOKEN</Code>, <Code>WHATSAPP_PHONE_NUMBER_ID</Code>, <Code>WHATSAPP_APP_SECRET</Code> (App-Einstellungen → Allgemein) und ein selbst gewähltes, langes <Code>WHATSAPP_VERIFY_TOKEN</Code>.</Step>
          <Step done={waBot}>In Meta → WhatsApp → Konfiguration die Webhook-URL <Code>{origin}/api/whatsapp/webhook</Code> und dasselbe Verify-Token eintragen, dann das Feld <Code>messages</Code> abonnieren.</Step>
          <Step>Testnachricht an die Nummer senden – sie erscheint unter „WhatsApp“.</Step>
        </ol>
        {!origin.startsWith('https://') && <p className="mt-3 text-xs text-amber-700">Hinweis: Meta verlangt eine öffentliche HTTPS-Adresse. Lokal (localhost) funktioniert der Webhook nicht.</p>}
      </Card>

      <Card title="E-Mail-Benachrichtigung bei neuen Anfragen" actions={status(i.email?.configured)}>
        <ol className="space-y-2">
          <Step done={i.email?.configured}>SMTP-Zugang Ihres E-Mail-Anbieters bereithalten (z. B. Google Workspace, Strato, IONOS).</Step>
          <Step done={i.email?.configured}>Secrets: <Code>SMTP_HOST</Code>, <Code>SMTP_PORT</Code>, <Code>SMTP_USER</Code>, <Code>SMTP_PASS</Code>, <Code>MAIL_FROM</Code>, <Code>ADMIN_NOTIFY_EMAIL</Code>.</Step>
        </ol>
        <p className="mt-3 text-xs text-slate-500">Die E-Mail enthält nur die Anfrage-ID und einen Link hierher – keine Kundendaten.</p>
      </Card>

      <Card title="Angebotsquelle für den Tarifvergleich" actions={status(i.offerProvider?.configured, i.offerProvider?.isDemo)}>
        <p className="text-sm text-slate-700">Aktuell: <strong>{i.offerProvider?.name}</strong>. Für echte Tarife wird der Zugang zu einer Vergleichs- oder Vermittlerplattform mit API benötigt (Vertrag + API-Dokumentation). Die Anbindung wird dann im Server ergänzt.</p>
      </Card>
    </div>
  );
}

function Security({ twoFactor }: { twoFactor: boolean }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="Zwei-Faktor-Anmeldung" actions={twoFactor ? <Badge tone="green">aktiv</Badge> : <Badge tone="amber">nicht aktiv</Badge>}>
        {twoFactor ? (
          <p className="text-sm text-slate-700">Für die Anmeldung werden Passwort und ein Code aus Ihrer Authenticator-App benötigt.</p>
        ) : (
          <>
            <p className="text-sm text-slate-700 mb-3">Empfohlen: Mit Zwei-Faktor-Anmeldung reicht ein gestohlenes Passwort nicht aus.</p>
            <ol className="space-y-2">
              <Step>Auf Ihrem Rechner im Projektordner <Code>npm run admin:2fa</Code> ausführen.</Step>
              <Step>Den angezeigten Schlüssel in Google/Microsoft Authenticator oder 1Password eintragen.</Step>
              <Step>Den Wert als Secret <Code>ADMIN_TOTP_SECRET</Code> auf dem Server hinterlegen und neu starten.</Step>
            </ol>
          </>
        )}
      </Card>
      <Card title="Passwort ändern">
        <ol className="space-y-2">
          <Step><Code>npm run admin:hash -- "neues langes Passwort"</Code> ausführen.</Step>
          <Step>Ergebnis als Secret <Code>ADMIN_PASSWORD_HASH</Code> ersetzen und neu starten. Alle bestehenden Sitzungen enden dabei.</Step>
        </ol>
      </Card>
      <Card title="Schutzmaßnahmen">
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Die Verwaltung ist eine eigene App unter <Code>/verwaltung</Code> und nicht Teil der öffentlichen Webseite.</li>
          <li>Sitzung als HttpOnly-Cookie, nach 8 Stunden abgelaufen; Anmeldeversuche auf 5 pro 15 Minuten begrenzt.</li>
          <li>Suchmaschinen werden ausgeschlossen (noindex).</li>
          <li>Rechnungen und Buchungen werden nie gelöscht, nur storniert bzw. gegengebucht.</li>
        </ul>
      </Card>
    </div>
  );
}
