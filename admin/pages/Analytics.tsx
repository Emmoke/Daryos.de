import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { request } from '../api';
import { Card, Empty, Notice, PageHeader, Spinner, Stat } from '../ui';

type Top = { key: string; count: number }[];
type Summary = {
  days: number;
  totals: { visits: number; comparisons: number; contacts: number; conversion: number; comparisonsWithoutRealOffer: number };
  series: { date: string; visits: number; comparisons: number; contacts: number }[];
  views: Top; referrers: Top; devices: Top; byEnergy: Top; byRegion: Top; byBand: Top; noRealOffer: Top; selectedOffers: Top;
  insights: string[];
};

const ROUTE_LABELS: Record<string, string> = { start: 'Startseite', vergleich: 'Tarifvergleich', status: 'Anfragestatus', konto: 'Mein Konto', sonstige: 'Sonstige' };

export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setData(null);
    request<Summary>('GET', `/admin/analytics?days=${days}`).then(setData).catch((e) => setError(e.message));
  }, [days]);

  return (
    <>
      <PageHeader
        title="Auswertung"
        description="Was Besucher suchen – um passendere Tarife zu finden und den Service zu verbessern. Nur Tageszahlen, keine Personendaten."
        actions={
          <div role="tablist" className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
            {[7, 30, 90, 365].map((d) => (
              <button key={d} role="tab" aria-selected={days === d} onClick={() => setDays(d)} className={`rounded-md px-2.5 py-1 text-xs font-medium ${days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{d === 365 ? '1 Jahr' : `${d} Tage`}</button>
            ))}
          </div>
        }
      />
      {error && <Notice tone="red">{error}</Notice>}
      {!data ? <Spinner /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Besuche" value={data.totals.visits} sub="nur mit Einwilligung gezählt" />
            <Stat label="Tarifvergleiche" value={data.totals.comparisons} sub={`${data.totals.comparisonsWithoutRealOffer} ohne echten Tarif`} tone={data.totals.comparisonsWithoutRealOffer ? 'amber' : undefined} />
            <Stat label="Anfragen" value={data.totals.contacts} />
            <Stat label="Vergleich → Anfrage" value={`${data.totals.conversion.toLocaleString('de-DE')} %`} />
          </div>

          <Card title={<span className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" aria-hidden /> Empfehlungen</span>}>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">{data.insights.map((t, i) => <li key={i}>{t}</li>)}</ul>
            <p className="mt-3 text-xs text-slate-500">Tipp: Fragen Sie Ihren Assistenten (unten rechts) „Was sagt die Auswertung – wo fehlen Tarife?“.</p>
          </Card>

          <Card title="Verlauf">
            <DayChart series={data.series} />
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Gesucht, aber kein echter Tarif (PLZ-Bereich)">
              <Bars items={data.noRealOffer} tone="bg-amber-500" empty="Für alle Suchen gab es echte Tarife – oder noch keine Daten." />
              {data.noRealOffer.length > 0 && <p className="mt-3 text-xs text-slate-500">Hier lohnt es sich, bei Ihren <a href="#/partner" className="text-indigo-600 hover:underline">Partnern</a> passende Tarife zu suchen und unter <a href="#/tarife" className="text-indigo-600 hover:underline">Tarife</a> einzutragen.</p>}
            </Card>
            <Card title="Vergleiche nach PLZ-Bereich"><Bars items={data.byRegion} /></Card>
            <Card title="Sparte und Verbrauch (kWh/Jahr)"><Bars items={data.byBand} /></Card>
            <Card title="Angefragte Angebote"><Bars items={data.selectedOffers} empty="Noch keine Anfragen." /></Card>
            <Card title="Meistbesuchte Seiten"><Bars items={data.views.map((v) => ({ ...v, key: ROUTE_LABELS[v.key] ?? v.key }))} empty="Noch keine Besuche mit Einwilligung." /></Card>
            <Card title="Herkunft der Besucher"><Bars items={data.referrers} empty="Noch keine Daten." /></Card>
          </div>
          <p className="text-xs text-slate-500">
            Datenschutz: Besuche werden nur gezählt, wenn der Besucher im Banner „Statistik erlauben“ wählt. Vergleiche und Anfragen werden ohne Personenbezug gezählt (Sparte, PLZ-Bereich mit 2 Ziffern, Verbrauchsklasse).
            Keine IP-Adressen, keine Cookies von Drittanbietern, keine Profile. Tageswerte werden nach 25 Monaten gelöscht.
          </p>
        </div>
      )}
    </>
  );
}

function Bars({ items, tone = 'bg-slate-900', empty = 'Noch keine Daten.' }: { items: Top; tone?: string; empty?: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.key} className="text-sm">
          <div className="flex justify-between gap-3"><span className="truncate">{i.key}</span><span className="tabular-nums text-slate-600">{i.count}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${(i.count / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function DayChart({ series }: { series: Summary['series'] }) {
  const max = Math.max(1, ...series.map((s) => Math.max(s.visits, s.comparisons)));
  const step = Math.ceil(series.length / 10);
  return (
    <div>
      <div className="flex items-end gap-px sm:gap-0.5 h-40" role="img" aria-label="Besuche, Vergleiche und Anfragen je Tag">
        {series.map((s, idx) => (
          <div key={s.date} className="flex-1 flex flex-col items-center h-full justify-end" title={`${new Date(s.date).toLocaleDateString('de-DE')}: ${s.visits} Besuche, ${s.comparisons} Vergleiche, ${s.contacts} Anfragen`}>
            <div className="flex items-end gap-px w-full justify-center h-full">
              <div className="w-1/3 max-w-2 rounded-t bg-slate-300" style={{ height: `${(s.visits / max) * 100}%` }} />
              <div className="w-1/3 max-w-2 rounded-t bg-slate-900" style={{ height: `${(s.comparisons / max) * 100}%` }} />
              <div className="w-1/3 max-w-2 rounded-t bg-emerald-500" style={{ height: `${(s.contacts / max) * 100}%` }} />
            </div>
            <span className="h-4 text-[10px] text-slate-500">{idx % step === 0 ? new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : ''}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-300" /> Besuche</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-900" /> Vergleiche</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Anfragen</span>
      </div>
    </div>
  );
}
