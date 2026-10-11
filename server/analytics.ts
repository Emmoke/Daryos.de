// Datensparsame Auswertung: nur zusammengezählte Tageswerte, keine IP-Adressen, keine Profile, keine Cookies.
// - Seitenaufrufe/Besuche werden nur gezählt, wenn der Besucher der Statistik zugestimmt hat (Einwilligungs-Banner).
// - Vergleiche und Anfragen werden ohne Personenbezug gezählt (Sparte, PLZ-Bereich, Verbrauchsklasse),
//   um das Tarifangebot zu verbessern (z. B. Regionen ohne passenden Tarif erkennen).
import type { Backend } from './persistence';
import type { ComparisonInput } from '../shared/platform';

export interface DailyStats {
  date: string;
  visits: number;
  views: Record<string, number>;
  referrers: Record<string, number>;
  devices: Record<string, number>;
  comparisons: number;
  byEnergy: Record<string, number>;
  byRegion: Record<string, number>;
  byBand: Record<string, number>;
  /** Vergleiche ohne echten Tarif aus dem Katalog (nur DEMO oder keine Treffer) je PLZ-Bereich */
  noRealOffer: Record<string, number>;
  contacts: number;
  selectedOffers: Record<string, number>;
}

const COLLECTION = 'analytics_daily';
const RETENTION_DAYS = 760;
const ROUTES = new Set(['start', 'vergleich', 'status', 'konto', 'leistungen', 'faq', 'kontakt', 'sonstige']);

export function consumptionBand(kwh: number) {
  if (kwh < 1500) return 'bis 1.500';
  if (kwh < 2500) return '1.500–2.500';
  if (kwh < 3500) return '2.500–3.500';
  if (kwh < 5000) return '3.500–5.000';
  if (kwh < 10000) return '5.000–10.000';
  return 'über 10.000';
}

const empty = (date: string): DailyStats => ({ date, visits: 0, views: {}, referrers: {}, devices: {}, comparisons: 0, byEnergy: {}, byRegion: {}, byBand: {}, noRealOffer: {}, contacts: 0, selectedOffers: {} });
const inc = (m: Record<string, number>, k: string, n = 1) => {
  // Begrenzung gegen beliebig viele Schlüssel
  if (!(k in m) && Object.keys(m).length >= 200) k = 'sonstige';
  m[k] = (m[k] ?? 0) + n;
};

export class AnalyticsStore {
  private days = new Map<string, DailyStats>();
  private constructor(private readonly backend?: Backend, private readonly now: () => Date = () => new Date()) {}

  static async open(backend?: Backend, now?: () => Date) {
    const s = new AnalyticsStore(backend, now);
    if (backend) for (const d of await backend.loadAll<DailyStats>(COLLECTION)) s.days.set(d.date, { ...empty(d.date), ...d });
    return s;
  }

  private async change(fn: (d: DailyStats) => void) {
    const date = this.now().toISOString().slice(0, 10);
    const next = structuredClone(this.days.get(date) ?? empty(date));
    fn(next);
    await this.backend?.put(COLLECTION, date, next);
    this.days.set(date, next);
  }

  /** Nur nach Einwilligung vom Browser gemeldet */
  recordEvent(e: { type: 'visit' | 'view'; route?: string; referrer?: string; device?: string }) {
    return this.change((d) => {
      if (e.type === 'visit') {
        d.visits += 1;
        if (e.referrer) inc(d.referrers, e.referrer);
        if (e.device === 'mobil' || e.device === 'desktop') inc(d.devices, e.device);
      }
      inc(d.views, e.route && ROUTES.has(e.route) ? e.route : 'sonstige');
    });
  }

  recordComparison(input: ComparisonInput, realOffers: number) {
    const region = String(input.postalCode).slice(0, 2);
    return this.change((d) => {
      d.comparisons += 1;
      inc(d.byEnergy, input.energyType);
      inc(d.byRegion, region);
      inc(d.byBand, `${input.energyType === 'gas' ? 'Gas' : 'Strom'} ${consumptionBand(input.annualConsumptionKwh)}`);
      if (!realOffers) inc(d.noRealOffer, `${region} (${input.energyType === 'gas' ? 'Gas' : 'Strom'})`);
    });
  }

  recordContact(offerLabel: string | undefined) {
    return this.change((d) => {
      d.contacts += 1;
      if (offerLabel) inc(d.selectedOffers, offerLabel.slice(0, 120));
    });
  }

  async purgeExpired(now: Date) {
    const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000).toISOString().slice(0, 10);
    for (const date of [...this.days.keys()]) {
      if (date < cutoff) {
        await this.backend?.remove(COLLECTION, date);
        this.days.delete(date);
      }
    }
  }

  /** Zusammenfassung für einen Zeitraum inkl. Tagesverlauf und Empfehlungen */
  summary(days = 30) {
    const now = this.now();
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) dates.push(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10));
    const total = empty('gesamt');
    const series = dates.map((date) => {
      const d = this.days.get(date) ?? empty(date);
      total.visits += d.visits;
      total.comparisons += d.comparisons;
      total.contacts += d.contacts;
      for (const key of ['views', 'referrers', 'devices', 'byEnergy', 'byRegion', 'byBand', 'noRealOffer', 'selectedOffers'] as const) {
        for (const [k, v] of Object.entries(d[key])) inc(total[key], k, v);
      }
      return { date, visits: d.visits, comparisons: d.comparisons, contacts: d.contacts };
    });
    const top = (m: Record<string, number>, n = 8) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
    const conversion = total.comparisons ? Math.round((total.contacts / total.comparisons) * 1000) / 10 : 0;
    const noReal = Object.values(total.noRealOffer).reduce((a, b) => a + b, 0);

    const insights: string[] = [];
    const gaps = top(total.noRealOffer, 3);
    if (gaps.length) insights.push(`Ohne echten Tarif gesucht: ${gaps.map((g) => `PLZ ${g.key} (${g.count}×)`).join(', ')} – dafür Tarife bei Ihren Partnern suchen und unter „Tarife“ eintragen.`);
    if (total.comparisons >= 10 && conversion < 5) insights.push(`Nur ${conversion} % der Vergleiche führen zu einer Anfrage – prüfen Sie Preise/Angebote und ob der Weg zur Anfrage klar ist.`);
    const gas = total.byEnergy.gas ?? 0;
    if (total.comparisons >= 10 && gas / total.comparisons > 0.4 && !Object.keys(total.selectedOffers).some((k) => /gas/i.test(k))) insights.push('Viele Gas-Vergleiche – lohnt sich ein zusätzlicher Gas-Partner?');
    const topRegion = top(total.byRegion, 1)[0];
    if (topRegion && total.comparisons >= 10) insights.push(`Die meisten Vergleiche kommen aus PLZ ${topRegion.key}… (${Math.round((topRegion.count / total.comparisons) * 100)} %) – lokale Werbung dort lohnt sich.`);
    if (total.visits >= 20 && total.comparisons / total.visits < 0.1) insights.push('Wenige Besucher starten einen Vergleich – den Tarifvergleich auf der Startseite noch deutlicher zeigen.');
    if (!insights.length) insights.push(total.comparisons ? 'Keine Auffälligkeiten im Zeitraum.' : 'Noch keine Daten im Zeitraum. Werte erscheinen, sobald Besucher die Webseite nutzen.');

    return {
      days,
      totals: { visits: total.visits, comparisons: total.comparisons, contacts: total.contacts, conversion, comparisonsWithoutRealOffer: noReal },
      series,
      views: top(total.views),
      referrers: top(total.referrers),
      devices: top(total.devices),
      byEnergy: top(total.byEnergy),
      byRegion: top(total.byRegion, 10),
      byBand: top(total.byBand, 12),
      noRealOffer: top(total.noRealOffer, 10),
      selectedOffers: top(total.selectedOffers),
      insights,
    };
  }
}
