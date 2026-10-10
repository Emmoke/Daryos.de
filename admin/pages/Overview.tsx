import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { STATUS_LABELS } from '../../shared/platform';
import { api, ApiError, dateTime, eur } from '../api';
import { Badge, Card, Empty, Notice, PageHeader, Spinner, Stat } from '../ui';
import { StatusBadge } from './Requests';

export function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.overview().then(setData).catch((e) => setError(e instanceof ApiError ? e.message : 'Fehler'));
    api.integrations().then(setIntegrations).catch(() => {});
  }, []);

  if (error) return <Notice tone="red">{error}</Notice>;
  if (!data) return <Spinner />;
  const a = data.accounting;
  const month = new Date().getMonth();

  const todo: { text: string; href: string }[] = [];
  if (data.requests.waiting) todo.push({ text: `${data.requests.waiting} Anfrage(n) warten auf Ihre Prüfung`, href: '#/anfragen' });
  if (data.whatsapp.needsHuman) todo.push({ text: `${data.whatsapp.needsHuman} WhatsApp-Gespräch(e) brauchen eine persönliche Antwort`, href: '#/whatsapp' });
  if (a?.openInvoices.overdue) todo.push({ text: `${a.openInvoices.overdue} Rechnung(en) überfällig`, href: '#/buchhaltung' });
  if (a?.settingsMissing.length) todo.push({ text: `Firmendaten unvollständig: ${a.settingsMissing.join(', ')}`, href: '#/einstellungen' });
  const notConnected = integrations ? Object.entries({ offerProvider: 'Angebotsquelle', assistant: 'KI-Assistent', whatsapp: 'WhatsApp-Bot', email: 'E-Mail' }).filter(([k]) => !integrations[k]?.configured || integrations[k]?.isDemo || (k === 'whatsapp' && integrations[k]?.mode !== 'business_api')).map(([, l]) => l) : [];
  if (notConnected.length) todo.push({ text: `Noch nicht verbunden: ${notConnected.join(', ')}`, href: '#/einstellungen' });

  return (
    <>
      <PageHeader title="Übersicht" description={new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Offene Prüfungen" value={data.requests.waiting} sub={`${data.requests.total} Anfragen insgesamt`} tone={data.requests.waiting ? 'amber' : undefined} />
        <Stat label="WhatsApp" value={data.whatsapp.configured ? data.whatsapp.needsHuman : '–'} sub={data.whatsapp.configured ? 'warten auf Antwort' : 'nicht verbunden'} />
        <Stat label={`Einnahmen ${a?.year ?? ''}`} value={a ? eur(a.incomeCents) : '–'} sub={a ? `diesen Monat ${eur(a.months[month].incomeCents)}` : undefined} />
        <Stat label="Offene Rechnungen" value={a ? eur(a.openInvoices.totalCents) : '–'} sub={a ? `${a.openInvoices.count} offen · ${a.openInvoices.overdue} überfällig` : undefined} tone={a?.openInvoices.overdue ? 'red' : undefined} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Zu erledigen">
          {todo.length === 0 ? (
            <Empty>Alles erledigt.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {todo.map((t) => (
                <li key={t.text}>
                  <a href={t.href} className="flex items-center justify-between gap-3 py-2.5 text-sm text-slate-700 hover:text-slate-900">
                    {t.text} <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Neueste Anfragen" actions={<a href="#/anfragen" className="text-xs font-medium text-indigo-600 hover:underline">Alle ansehen</a>}>
          {data.requests.recent.length === 0 ? (
            <Empty>Noch keine Anfragen.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.requests.recent.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.customerName ?? 'Nur Vergleich'} <span className="text-slate-400 font-normal">· {r.energyType === 'gas' ? 'Gas' : 'Strom'}</span></p>
                    <p className="text-xs text-slate-500 font-mono">{r.id} · {dateTime(r.createdAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {a && (
          <Card title={`Einnahmen und Ausgaben ${a.year}`} className="lg:col-span-2">
            <MonthChart months={a.months} />
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <span>Einnahmen <strong className="tabular-nums">{eur(a.incomeCents)}</strong></span>
              <span>Ausgaben <strong className="tabular-nums">{eur(a.expenseCents)}</strong></span>
              <span>Ergebnis <strong className={`tabular-nums ${a.resultCents < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{eur(a.resultCents)}</strong></span>
              {a.smallBusiness && <Badge>Kleinunternehmer § 19 UStG</Badge>}
            </div>
          </Card>
        )}

        <Card title="Anfragen nach Status" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.requests.byStatus).length === 0 && <span className="text-sm text-slate-500">Keine Daten.</span>}
            {Object.entries(data.requests.byStatus).map(([s, n]) => (
              <a key={s} href="#/anfragen" className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                <span className="text-slate-500">{STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s}</span> <strong className="ml-1 tabular-nums">{n as number}</strong>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function MonthChart({ months }: { months: { month: number; incomeCents: number; expenseCents: number }[] }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.incomeCents, m.expenseCents]));
  const names = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-3 h-40" role="img" aria-label="Einnahmen und Ausgaben je Monat">
        {months.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${names[m.month - 1]}: Einnahmen ${eur(m.incomeCents)}, Ausgaben ${eur(m.expenseCents)}`}>
            <div className="flex items-end gap-0.5 w-full justify-center h-full">
              <div className="w-1/2 max-w-3 rounded-t bg-slate-900" style={{ height: `${(Math.max(0, m.incomeCents) / max) * 100}%` }} />
              <div className="w-1/2 max-w-3 rounded-t bg-slate-300" style={{ height: `${(Math.max(0, m.expenseCents) / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-slate-500">{names[m.month - 1]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-900" /> Einnahmen</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Ausgaben</span>
      </div>
    </div>
  );
}
