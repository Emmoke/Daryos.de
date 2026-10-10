import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Download, ExternalLink, Flame, Info, Loader2, MessageSquare, Printer, Send, X, Zap } from 'lucide-react';
import type { ComparisonInput, EnergyType, IntegrationStatus, RankedOffer } from '../../shared/platform';
import { estimateConsumption } from '../../server/validation';
import { api, ApiError, dateTime, eur, type CompareResponse, type ContactResponse } from './api';
import { downloadOfferPdf } from './offerPdf';
import { compareLocally, whatsappInquiryUrl } from './localCompare';

type SortKey = 'annual' | 'firstYear' | 'guarantee' | 'term';

const inputCls =
  'w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30';
const labelCls = 'block text-sm font-medium text-slate-200 mb-1';

function FieldError({ msg, id }: { msg?: string; id: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-rose-400">
      {msg}
    </p>
  );
}

function DemoBanner() {
  return (
    <div role="note" className="flex gap-3 p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-100">
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
      <div className="text-sm">
        <p className="font-bold">DEMO-Modus – keine realen Tarife</p>
        <p>
          Die angezeigten Angebote sind frei erfundene Testdaten, um den Ablauf zu zeigen. Sie sind nicht buchbar. Echte Angebote erscheinen,
          sobald Daryos eine autorisierte Angebotsquelle angebunden hat.
        </p>
      </div>
    </div>
  );
}

function PreviewNote() {
  return (
    <div role="note" className="p-4 rounded-xl border border-blue-500/50 bg-blue-500/10 text-blue-100 text-sm">
      <p className="font-semibold">Vorschau-Modus</p>
      <p>
        Diese Adresse läuft ohne Server. Der Vergleich wird direkt in Ihrem Browser mit Testdaten berechnet und nicht gespeichert. Ihre Anfrage
        senden Sie per WhatsApp – Daryos prüft dann echte, aktuell verfügbare Angebote für Sie.
      </p>
    </div>
  );
}

interface Props {
  onOpenPrivacy: () => void;
}

export function VergleichPage({ onOpenPrivacy }: Props) {
  const [energyType, setEnergyType] = useState<EnergyType>('gas');
  const [form, setForm] = useState({
    postalCode: '',
    city: '',
    annualConsumptionKwh: '',
    householdSize: '2',
    livingSpace: '',
    currentProvider: '',
    currentTariff: '',
    currentAnnualCostEur: '',
    desiredStartDate: '',
    maxContractMonths: '',
    minPriceGuaranteeMonths: '',
    ecoOnly: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [submittedInput, setSubmittedInput] = useState<ComparisonInput | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('annual');
  const [onlyGuarantee, setOnlyGuarantee] = useState(false);
  const [detail, setDetail] = useState<RankedOffer | null>(null);
  const [contactOffer, setContactOffer] = useState<RankedOffer | null>(null);
  const [sent, setSent] = useState<ContactResponse | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);

  const [serverMissing, setServerMissing] = useState('');

  useEffect(() => {
    api.integrations().then(setIntegrations).catch((err) => {
      setIntegrations(null);
      if (err instanceof ApiError && err.status === 503) setServerMissing(err.message);
    });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const applyEstimate = () => {
    const kwh = estimateConsumption(energyType, Number(form.householdSize) || 1, Number(form.livingSpace) || undefined);
    setForm((f) => ({ ...f, annualConsumptionKwh: String(kwh) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGlobalError('');
    const payload = {
      energyType,
      postalCode: form.postalCode,
      city: form.city,
      annualConsumptionKwh: form.annualConsumptionKwh,
      householdSize: form.householdSize,
      currentProvider: form.currentProvider,
      currentTariff: form.currentTariff,
      currentAnnualCostEur: form.currentAnnualCostEur,
      desiredStartDate: form.desiredStartDate,
      maxContractMonths: form.maxContractMonths,
      minPriceGuaranteeMonths: form.minPriceGuaranteeMonths,
      ecoOnly: form.ecoOnly,
    };
    const runLocally = async () => {
      const local = await compareLocally(payload);
      if (!local.ok) {
        setErrors(local.fields);
        setGlobalError('Bitte prüfen Sie Ihre Angaben.');
        return;
      }
      setResult(local.response);
      setSubmittedInput(local.input);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    try {
      if (serverMissing) return await runLocally();
      const res = await api.compare(payload);
      setResult(res);
      setSubmittedInput({
        energyType,
        postalCode: form.postalCode,
        annualConsumptionKwh: Math.round(Number(form.annualConsumptionKwh.replace(',', '.'))),
        currentAnnualCostEur: form.currentAnnualCostEur ? Number(form.currentAnnualCostEur) : undefined,
        desiredStartDate: form.desiredStartDate || undefined,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 503 && !Object.keys(err.fields).length) {
        setServerMissing(err.message);
        await runLocally();
      } else if (err instanceof ApiError) {
        setErrors(err.fields);
        setGlobalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Im Vorschau-Modus (ohne Server) geht die Anfrage per WhatsApp statt über das Formular
  const startContact = (r: RankedOffer) => {
    if (serverMissing && submittedInput) {
      window.open(whatsappInquiryUrl(r, submittedInput), '_blank', 'noopener,noreferrer');
      return;
    }
    setContactOffer(r);
  };
  const contactLabel = serverMissing ? 'Per WhatsApp anfragen' : 'Unverbindlich anfragen';

  const visibleOffers = useMemo(() => {
    if (!result) return [];
    const offers = result.comparison.offers.filter((o) => !onlyGuarantee || (o.offer.priceGuaranteeMonths ?? 0) > 0);
    const complete = offers.filter((o) => o.complete);
    const incomplete = offers.filter((o) => !o.complete);
    const by: Record<SortKey, (a: RankedOffer, b: RankedOffer) => number> = {
      annual: (a, b) => a.cost!.annualCostWithoutBonusEur - b.cost!.annualCostWithoutBonusEur,
      firstYear: (a, b) => a.cost!.firstYearCostWithBonusEur - b.cost!.firstYearCostWithBonusEur,
      guarantee: (a, b) => (b.offer.priceGuaranteeMonths ?? 0) - (a.offer.priceGuaranteeMonths ?? 0),
      term: (a, b) => (a.offer.contractTermMonths ?? 99) - (b.offer.contractTermMonths ?? 99),
    };
    return [...complete.sort(by[sortKey]), ...incomplete];
  }, [result, sortKey, onlyGuarantee]);

  if (sent) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" aria-hidden />
          <h1 className="text-2xl font-bold">{sent.duplicate ? 'Ihre Anfrage liegt uns bereits vor' : 'Ihre unverbindliche Anfrage ist eingegangen'}</h1>
          <p className="text-slate-300">
            Ihre Anfrage-ID lautet <strong className="font-mono text-orange-300">{sent.requestId}</strong>. Bitte notieren Sie sie für Rückfragen.
          </p>
          <p className="text-slate-400 text-sm">
            Aktueller Status: <strong>{sent.status.statusLabel}</strong>. Es wurde <strong>kein Vertrag</strong> abgeschlossen. Daryos prüft Ihre Anfrage
            und meldet sich über den gewünschten Kontaktweg.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a href={`#/status/${sent.requestId}`} className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold">
              Status ansehen
            </a>
            <a href="#" className="px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800">
              Zur Startseite
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (result && submittedInput) {
    const c = result.comparison;
    return (
      <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <button onClick={() => setResult(null)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Angaben ändern
        </button>
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            {c.offers.length} {c.offers.length === 1 ? 'Angebot' : 'Angebote'} für {energyType === 'gas' ? 'Gas' : 'Strom'} in {submittedInput.postalCode}
          </h1>
          <p className="text-sm text-slate-400">
            Quelle: {c.providerName} · Stand: {dateTime(c.fetchedAt)} · Anfrage-ID <span className="font-mono">{result.requestId}</span>
          </p>
        </header>
        {c.isDemo && <DemoBanner />}
        {serverMissing && <PreviewNote />}

        {c.status !== 'ok' && (
          <div role="alert" className="p-4 rounded-xl border border-rose-500/50 bg-rose-500/10 text-rose-100">
            <p className="font-semibold">{c.status === 'no_offers' ? 'Keine passenden Angebote' : 'Angebote derzeit nicht abrufbar'}</p>
            <p className="text-sm">{c.message}</p>
            <p className="text-sm mt-2">
              Gern prüft Daryos Ihre Situation persönlich: <a className="underline" href="#booking">Beratungstermin vereinbaren</a>.
            </p>
          </div>
        )}

        {c.offers.length > 0 && (
          <>
            <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <label className="text-sm">
                <span className="block text-slate-300 mb-1">Sortieren nach</span>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={inputCls}>
                  <option value="annual">Jahreskosten (ohne Bonus)</option>
                  <option value="firstYear">Kosten 1. Jahr inkl. Bonus</option>
                  <option value="guarantee">Längste Preisgarantie</option>
                  <option value="term">Kürzeste Laufzeit</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm pb-3">
                <input type="checkbox" checked={onlyGuarantee} onChange={(e) => setOnlyGuarantee(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                Nur mit Preisgarantie
              </label>
              {!c.cheapestFlagValid && c.offers.length > 1 && (
                <p className="text-xs text-slate-400 pb-3 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" aria-hidden /> Keine „Günstigster“-Markierung: Nicht alle Angebote sind vollständig vergleichbar.
                </p>
              )}
            </div>

            <ul className="space-y-4">
              {visibleOffers.map((r) => (
                <OfferCard
                  key={r.offer.id}
                  ranked={r}
                  onDetails={() => setDetail(r)}
                  onContact={() => startContact(r)}
                  contactLabel={contactLabel}
                />
              ))}
            </ul>
            <AssistantBox requestId={result.requestId} configured={integrations?.assistant.configured ?? false} />
          </>
        )}

        {detail && (
          <OfferDetailModal
            ranked={detail}
            input={submittedInput}
            requestId={result.requestId}
            integrations={integrations}
            onClose={() => setDetail(null)}
            contactLabel={contactLabel}
            onContact={() => {
              startContact(detail);
              setDetail(null);
            }}
          />
        )}
        {contactOffer && (
          <ContactModal
            ranked={contactOffer}
            requestId={result.requestId}
            whatsappAvailable={integrations?.whatsapp.configured ?? false}
            onOpenPrivacy={onOpenPrivacy}
            onClose={() => setContactOffer(null)}
            onSent={setSent}
          />
        )}
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Energietarife vergleichen</h1>
      <p className="text-slate-300 mb-6">
        Geben Sie Ihre Verbrauchsdaten ein – wir zeigen Ihnen verfügbare Angebote aus unserer angebundenen Angebotsquelle. Für den Vergleich benötigen wir
        <strong> keine persönlichen Kontaktdaten</strong>.
      </p>
      {serverMissing && (
        <div className="mb-6">
          <PreviewNote />
        </div>
      )}
      {(integrations?.offerProvider.isDemo || serverMissing) && (
        <div className="mb-6">
          <DemoBanner />
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <fieldset>
          <legend className={labelCls}>Vertragsart</legend>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {(['gas', 'strom'] as const).map((t) => (
              <button
                type="button"
                key={t}
                role="radio"
                aria-checked={energyType === t}
                onClick={() => setEnergyType(t)}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border text-lg font-semibold transition-colors ${
                  energyType === t ? 'border-orange-500 bg-orange-500/15 text-orange-200' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                {t === 'gas' ? <Flame className="w-5 h-5" aria-hidden /> : <Zap className="w-5 h-5" aria-hidden />}
                {t === 'gas' ? 'Gas' : 'Strom'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="plz" className={labelCls}>Postleitzahl *</label>
            <input id="plz" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={form.postalCode} onChange={set('postalCode')} className={inputCls} aria-invalid={!!errors.postalCode} aria-describedby="plz-err" />
            <FieldError id="plz-err" msg={errors.postalCode} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ort" className={labelCls}>Ort (optional)</label>
            <input id="ort" autoComplete="address-level2" value={form.city} onChange={set('city')} className={inputCls} />
          </div>
        </div>

        <div>
          <label htmlFor="kwh" className={labelCls}>Jahresverbrauch in kWh *</label>
          <input id="kwh" inputMode="numeric" value={form.annualConsumptionKwh} onChange={set('annualConsumptionKwh')} className={inputCls} placeholder="steht auf Ihrer letzten Jahresabrechnung" aria-invalid={!!errors.annualConsumptionKwh} aria-describedby="kwh-err" />
          <FieldError id="kwh-err" msg={errors.annualConsumptionKwh} />
          <details className="mt-2 text-sm text-slate-300">
            <summary className="cursor-pointer text-orange-300">Verbrauch unbekannt? Schätzen lassen</summary>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label>
                <span className="block mb-1">Personen im Haushalt</span>
                <select value={form.householdSize} onChange={set('householdSize')} className={inputCls}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              {energyType === 'gas' && (
                <label>
                  <span className="block mb-1">Wohnfläche m² (optional)</span>
                  <input inputMode="numeric" value={form.livingSpace} onChange={set('livingSpace')} className={inputCls} />
                </label>
              )}
              <button type="button" onClick={applyEstimate} className="px-4 py-2.5 rounded-lg border border-orange-500/60 text-orange-200 hover:bg-orange-500/10">
                Schätzwert übernehmen
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Grober Richtwert. Für einen genauen Vergleich nutzen Sie bitte den Wert Ihrer Jahresabrechnung.</p>
          </details>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="anbieter" className={labelCls}>Aktueller Anbieter (optional)</label>
            <input id="anbieter" value={form.currentProvider} onChange={set('currentProvider')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="tarif" className={labelCls}>Aktueller Tarif (optional)</label>
            <input id="tarif" value={form.currentTariff} onChange={set('currentTariff')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="kosten" className={labelCls}>Aktuelle Jahreskosten in € (optional)</label>
            <input id="kosten" inputMode="decimal" value={form.currentAnnualCostEur} onChange={set('currentAnnualCostEur')} className={inputCls} aria-describedby="kosten-err" />
            <FieldError id="kosten-err" msg={errors.currentAnnualCostEur} />
          </div>
          <div>
            <label htmlFor="start" className={labelCls}>Gewünschter Lieferbeginn (optional)</label>
            <input id="start" type="date" value={form.desiredStartDate} onChange={set('desiredStartDate')} className={inputCls} aria-describedby="start-err" />
            <FieldError id="start-err" msg={errors.desiredStartDate} />
          </div>
          <div>
            <label htmlFor="laufzeit" className={labelCls}>Maximale Vertragslaufzeit</label>
            <select id="laufzeit" value={form.maxContractMonths} onChange={set('maxContractMonths')} className={inputCls}>
              <option value="">egal</option>
              <option value="1">monatlich kündbar</option>
              <option value="12">bis 12 Monate</option>
              <option value="24">bis 24 Monate</option>
            </select>
          </div>
          <div>
            <label htmlFor="garantie" className={labelCls}>Preisgarantie mindestens</label>
            <select id="garantie" value={form.minPriceGuaranteeMonths} onChange={set('minPriceGuaranteeMonths')} className={inputCls}>
              <option value="">egal</option>
              <option value="12">12 Monate</option>
              <option value="24">24 Monate</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.ecoOnly} onChange={set('ecoOnly')} className="w-4 h-4 accent-orange-500" />
          Nur Öko-Tarife ({energyType === 'gas' ? 'Biogas-Anteil/klimaneutral' : 'Ökostrom'}, laut Anbieterangabe)
        </label>

        <p className="text-xs text-slate-400">
          Verwendungszweck: Ihre Angaben werden nur für die Angebotssuche verwendet und ohne Kontaktdaten gespeichert (Löschung nach 30 Tagen).{' '}
          <button type="button" onClick={onOpenPrivacy} className="underline">Datenschutz</button>
        </p>
        {globalError && !Object.keys(errors).length && globalError !== serverMissing && <p role="alert" className="text-rose-400">{globalError}</p>}
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-lg font-bold">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : null}
          {loading ? 'Angebote werden abgerufen …' : 'Angebote anzeigen'}
        </button>
      </form>
    </section>
  );
}

function OfferCard({ ranked, onDetails, onContact, contactLabel }: { ranked: RankedOffer; onDetails: () => void; onContact: () => void; contactLabel: string }) {
  const o = ranked.offer;
  return (
    <li className={`p-5 rounded-2xl border ${ranked.isCheapest ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'} ${!ranked.complete ? 'opacity-70' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-1">
            {o.source.isDemo && <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">DEMO</span>}
            {ranked.isCheapest && <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Günstigstes vollständiges Angebot</span>}
            {o.eco && <span className="text-[11px] px-2 py-0.5 rounded bg-green-900/40 text-green-300">Öko</span>}
          </div>
          <h2 className="text-lg font-bold">{o.tariffName}</h2>
          <p className="text-sm text-slate-400">{o.providerName}</p>
        </div>
        <div className="text-right">
          {ranked.cost ? (
            <>
              <p className="text-2xl font-bold">{eur(ranked.cost.annualCostWithoutBonusEur)}</p>
              <p className="text-xs text-slate-400">geschätzt pro Jahr, ohne Bonus</p>
              {ranked.cost.oneTimeBonusEur > 0 && (
                <p className="text-xs text-slate-300 mt-1">1. Jahr mit Bonus: {eur(ranked.cost.firstYearCostWithBonusEur)}</p>
              )}
              {ranked.cost.savingsVsCurrentEur !== null && ranked.cost.savingsVsCurrentEur > 0 && (
                <p className="text-xs text-emerald-400 mt-1">ca. {eur(ranked.cost.savingsVsCurrentEur)} weniger als Ihre Angabe</p>
              )}
            </>
          ) : (
            <p className="text-sm text-amber-300 max-w-[14rem]">Unvollständig – nicht vergleichbar (fehlt: {ranked.missingFields.join(', ')})</p>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
        <div><dt className="text-slate-400">Arbeitspreis</dt><dd>{o.workPriceCtPerKwh !== null ? `${o.workPriceCtPerKwh.toLocaleString('de-DE')} ct/kWh` : '–'}</dd></div>
        <div><dt className="text-slate-400">Grundpreis</dt><dd>{o.basePriceEurPerMonth !== null ? `${eur(o.basePriceEurPerMonth)}/Monat` : '–'}</dd></div>
        <div><dt className="text-slate-400">Preisgarantie</dt><dd>{o.priceGuaranteeMonths === null ? '–' : o.priceGuaranteeMonths ? `${o.priceGuaranteeMonths} Monate` : 'keine'}</dd></div>
        <div><dt className="text-slate-400">Laufzeit / Kündigung</dt><dd>{o.contractTermMonths ?? '–'} Mon. / {o.noticePeriodWeeks ?? '–'} Wo.</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={onDetails} className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium">Details & Druck</button>
        {ranked.complete && (
          <button onClick={onContact} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-sm font-semibold">{contactLabel}</button>
        )}
      </div>
    </li>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="print-area w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-4 mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Schließen" className="no-print p-1 rounded hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OfferDetailModal({ ranked, input, requestId, integrations, onClose, onContact, contactLabel }: {
  ranked: RankedOffer; input: ComparisonInput; requestId: string; integrations: IntegrationStatus | null; onClose: () => void; onContact: () => void; contactLabel: string;
}) {
  const o = ranked.offer;
  const wa = integrations?.whatsapp.configured && integrations.whatsapp.number;
  return (
    <Modal title={`${o.tariffName} – ${o.providerName}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        {o.source.isDemo && <DemoBanner />}
        <table className="w-full">
          <tbody className="divide-y divide-slate-800">
            <tr><th className="text-left py-2 text-slate-400 font-normal">Arbeitspreis (brutto)</th><td>{o.workPriceCtPerKwh ?? '–'} ct/kWh</td></tr>
            <tr><th className="text-left py-2 text-slate-400 font-normal">Grundpreis (brutto)</th><td>{o.basePriceEurPerMonth !== null ? `${eur(o.basePriceEurPerMonth)} / Monat` : '–'}</td></tr>
            <tr><th className="text-left py-2 text-slate-400 font-normal">Preisgarantie</th><td>{o.priceGuaranteeMonths ? `${o.priceGuaranteeMonths} Monate${o.priceGuaranteeType ? ` (${o.priceGuaranteeType})` : ''}` : o.priceGuaranteeMonths === 0 ? 'keine' : '–'}</td></tr>
            <tr><th className="text-left py-2 text-slate-400 font-normal">Vertragslaufzeit</th><td>{o.contractTermMonths ?? '–'} Monate</td></tr>
            <tr><th className="text-left py-2 text-slate-400 font-normal">Kündigungsfrist</th><td>{o.noticePeriodWeeks ?? '–'} Wochen</td></tr>
            {o.earliestStartDate && <tr><th className="text-left py-2 text-slate-400 font-normal">Lieferbeginn</th><td>{o.earliestStartDate} (vorbehaltlich Anbieterprüfung)</td></tr>}
            {o.bonuses.map((b) => (
              <tr key={b.label}><th className="text-left py-2 text-slate-400 font-normal">Bonus</th><td>{b.label}: {eur(b.amountEur)} – {b.conditions}{b.oneTime ? ' (einmalig, keine dauerhafte Ersparnis)' : ''}</td></tr>
            ))}
          </tbody>
        </table>
        {ranked.cost && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="font-semibold mb-2">So berechnen wir die Kosten (Schätzung für {input.annualConsumptionKwh.toLocaleString('de-DE')} kWh)</p>
            <p>Grundpreis × 12 = {eur(ranked.cost.baseCostEur)}</p>
            <p>Arbeitspreis × Verbrauch = {eur(ranked.cost.workCostEur)}</p>
            <p className="font-bold mt-1">Jahreskosten ohne Bonus: {eur(ranked.cost.annualCostWithoutBonusEur)}</p>
            {ranked.cost.oneTimeBonusEur > 0 && <p>1. Jahr bei Erfüllung der Bonusbedingungen: {eur(ranked.cost.firstYearCostWithBonusEur)}</p>}
            <p className="text-xs text-slate-400 mt-2">Abgerechnet wird Ihr tatsächlicher Verbrauch. Preise nach Ablauf der Preisgarantie können sich ändern.</p>
          </div>
        )}
        <p className="text-xs text-slate-400">Quelle: {o.source.name} · Stand {dateTime(o.source.fetchedAt)} · Anfrage-ID {requestId}</p>
        <div className="no-print flex flex-wrap gap-2 pt-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"><Printer className="w-4 h-4" aria-hidden /> Drucken</button>
          <button onClick={() => downloadOfferPdf(ranked, input, requestId)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"><Download className="w-4 h-4" aria-hidden /> PDF</button>
          {o.officialUrl && !o.source.isDemo && (
            <a href={o.officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"><ExternalLink className="w-4 h-4" aria-hidden /> Offizielle Anbieterseite</a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${integrations!.whatsapp.number}?text=${encodeURIComponent(`Hallo Daryos, ich habe eine Frage zu meiner Anfrage ${requestId} (${o.tariffName}).`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/30"
            >
              <MessageSquare className="w-4 h-4" aria-hidden /> Frage per WhatsApp
            </a>
          )}
          {ranked.complete && <button onClick={onContact} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold">{contactLabel}</button>}
        </div>
      </div>
    </Modal>
  );
}

function ContactModal({ ranked, requestId, whatsappAvailable, onOpenPrivacy, onClose, onSent }: {
  ranked: RankedOffer; requestId: string; whatsappAvailable: boolean; onOpenPrivacy: () => void; onClose: () => void; onSent: (r: ContactResponse) => void;
}) {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '', preferredChannel: 'email', consentPrivacy: false, consentWhatsapp: false, website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setError('');
    try {
      onSent(await api.contact(requestId, { ...f, offerId: ranked.offer.id }));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields);
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Unverbindliche Anfrage senden" onClose={onClose}>
      <form onSubmit={send} noValidate className="space-y-4 text-sm">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <p className="font-semibold">{ranked.offer.tariffName} – {ranked.offer.providerName} {ranked.offer.source.isDemo && <span className="text-amber-300">(DEMO)</span>}</p>
          <p className="text-slate-400">Anfrage-ID {requestId}</p>
        </div>
        <p className="flex gap-2 text-slate-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" aria-hidden />
          Sie senden nur eine <strong>&nbsp;unverbindliche Anfrage&nbsp;</strong> an Daryos. Es wird kein Vertrag abgeschlossen. Daryos prüft das Angebot und meldet sich bei Ihnen.
        </p>
        {/* Honeypot gegen Spam-Bots – für Menschen unsichtbar */}
        <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="c-name" className={labelCls}>Name *</label>
            <input id="c-name" autoComplete="name" value={f.name} onChange={set('name')} className={inputCls} aria-describedby="c-name-err" />
            <FieldError id="c-name-err" msg={errors.name} />
          </div>
          <div>
            <label htmlFor="c-mail" className={labelCls}>E-Mail *</label>
            <input id="c-mail" type="email" autoComplete="email" value={f.email} onChange={set('email')} className={inputCls} aria-describedby="c-mail-err" />
            <FieldError id="c-mail-err" msg={errors.email} />
          </div>
          <div>
            <label htmlFor="c-chan" className={labelCls}>Bevorzugter Kontaktweg</label>
            <select id="c-chan" value={f.preferredChannel} onChange={set('preferredChannel')} className={inputCls}>
              <option value="email">E-Mail</option>
              <option value="telefon">Rückruf</option>
              {whatsappAvailable && <option value="whatsapp">WhatsApp</option>}
            </select>
          </div>
          <div>
            <label htmlFor="c-tel" className={labelCls}>Telefon {f.preferredChannel !== 'email' ? '*' : '(optional)'}</label>
            <input id="c-tel" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} className={inputCls} aria-describedby="c-tel-err" />
            <FieldError id="c-tel-err" msg={errors.phone} />
          </div>
        </div>
        <div>
          <label htmlFor="c-msg" className={labelCls}>Nachricht (optional)</label>
          <textarea id="c-msg" rows={3} maxLength={2000} value={f.message} onChange={set('message')} className={inputCls} />
        </div>
        <p className="text-xs text-slate-400">Lieferadresse und Zählernummer erfragen wir erst, wenn Sie sich für einen Wechsel entscheiden.</p>
        <label className="flex gap-2 items-start">
          <input type="checkbox" checked={f.consentPrivacy} onChange={set('consentPrivacy')} className="w-4 h-4 mt-0.5 accent-orange-500" />
          <span>
            Ich willige ein, dass Daryos meine Angaben zur Bearbeitung dieser Anfrage verarbeitet (Löschung spätestens nach 180 Tagen, sofern kein Vertrag
            zustande kommt). <button type="button" onClick={onOpenPrivacy} className="underline">Datenschutzerklärung</button> *
          </span>
        </label>
        <FieldError id="c-consent-err" msg={errors.consentPrivacy} />
        {f.preferredChannel === 'whatsapp' && (
          <>
            <label className="flex gap-2 items-start">
              <input type="checkbox" checked={f.consentWhatsapp} onChange={set('consentWhatsapp')} className="w-4 h-4 mt-0.5 accent-orange-500" />
              <span>Ich bin einverstanden, dass Daryos mich zu dieser Anfrage per WhatsApp kontaktiert. Ich kann dies jederzeit widerrufen. *</span>
            </label>
            <FieldError id="c-wa-err" msg={errors.consentWhatsapp} />
          </>
        )}
        {error && !Object.keys(errors).length && <p role="alert" className="text-rose-400">{error}</p>}
        <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-60 font-bold">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />} Unverbindliche Anfrage senden
        </button>
      </form>
    </Modal>
  );
}

function AssistantBox({ requestId, configured }: { requestId: string; configured: boolean }) {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<{ text: string; disclaimer?: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await api.ask(requestId, q.trim());
      setAnswer({ text: r.answer, disclaimer: r.disclaimer });
    } catch (err) {
      setAnswer({ text: err instanceof ApiError ? err.message : 'Fehler', error: true });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
      <h2 className="font-bold mb-1">Fragen zu den Angeboten?</h2>
      <p className="text-sm text-slate-400 mb-3">
        {configured
          ? 'Unser KI-Assistent erklärt die angezeigten Angebote – ausschließlich auf Basis der hier gezeigten Daten und unverbindlich.'
          : 'Der KI-Assistent ist noch nicht eingerichtet. Ihre Frage beantwortet Daryos gern persönlich über die Anfrage.'}
      </p>
      {configured && (
        <form onSubmit={ask} className="flex gap-2">
          <label htmlFor="ki-q" className="sr-only">Ihre Frage</label>
          <input id="ki-q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="z. B. Was bedeutet eingeschränkte Preisgarantie?" className={inputCls} />
          <button disabled={busy} className="px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span className="sr-only">Fragen</span></button>
        </form>
      )}
      {answer && (
        <div className={`mt-3 p-3 rounded-lg text-sm whitespace-pre-line ${answer.error ? 'bg-rose-500/10 text-rose-200' : 'bg-slate-800'}`}>
          {answer.text}
          {answer.disclaimer && <p className="text-xs text-slate-400 mt-2">{answer.disclaimer}</p>}
        </div>
      )}
    </div>
  );
}
